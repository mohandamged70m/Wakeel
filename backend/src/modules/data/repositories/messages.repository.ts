import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";
import type { Message } from "../types.js";

export type InsertMessageInput = {
  organizationId: string;
  conversationId: string;
  whatsappMessageId: string | null;
  direction: "in" | "out";
  senderType: "customer" | "bot" | "agent" | "owner";
  type: string;
  content: string | null;
  mediaUrl?: string | null;
};

@Injectable()
export class MessagesRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async insert(input: InsertMessageInput): Promise<{ inserted: boolean; message: Message | null }> {
    if (this.supabase.client) {
      const row = {
        organization_id: input.organizationId,
        conversation_id: input.conversationId,
        whatsapp_message_id: input.whatsappMessageId,
        direction: input.direction,
        sender_type: input.senderType,
        type: input.type,
        content: input.content,
        media_url: input.mediaUrl ?? null,
      };
      const { data, error } = await this.supabase.client
        .from("messages")
        .upsert(row, { onConflict: "whatsapp_message_id", ignoreDuplicates: true })
        .select()
        .maybeSingle();
      if (error) {
        // unique violation fallback
        if (input.whatsappMessageId) {
          const { data: existing } = await this.supabase.client
            .from("messages")
            .select()
            .eq("whatsapp_message_id", input.whatsappMessageId)
            .maybeSingle();
          if (existing) return { inserted: false, message: this.map(existing as Record<string, unknown>) };
        }
        throw new Error(error.message);
      }
      if (!data) return { inserted: false, message: null };
      return { inserted: true, message: this.map(data as Record<string, unknown>) };
    }

    // in-memory path
    if (input.whatsappMessageId && this.memory.messageIds.has(input.whatsappMessageId)) {
      return { inserted: false, message: null };
    }
    const m: Message = {
      id: this.memory.id(),
      organizationId: input.organizationId,
      conversationId: input.conversationId,
      whatsappMessageId: input.whatsappMessageId,
      direction: input.direction,
      senderType: input.senderType,
      type: input.type,
      content: input.content,
      mediaUrl: input.mediaUrl ?? null,
      status: "sent",
      createdAt: this.memory.now(),
    };
    this.memory.messages.set(m.id, m);
    if (input.whatsappMessageId) this.memory.messageIds.add(input.whatsappMessageId);
    return { inserted: true, message: m };
  }

  async listByConversation(orgId: string, conversationId: string, limit = 100): Promise<Message[]> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("messages")
        .select()
        .eq("organization_id", orgId)
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true })
        .limit(limit);
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map((r) => this.map(r));
    }
    return [...this.memory.messages.values()]
      .filter((m) => m.organizationId === orgId && m.conversationId === conversationId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  private map(r: Record<string, unknown>): Message {
    return {
      id: String(r.id),
      organizationId: String(r.organization_id),
      conversationId: String(r.conversation_id),
      whatsappMessageId: (r.whatsapp_message_id as string | null) ?? null,
      direction: r.direction as "in" | "out",
      senderType: r.sender_type as Message["senderType"],
      type: String(r.type),
      content: (r.content as string | null) ?? null,
      mediaUrl: (r.media_url as string | null) ?? null,
      status: String(r.status ?? "sent"),
      createdAt: String(r.created_at),
    };
  }
}
