import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";
import type { Conversation } from "../types.js";

@Injectable()
export class ConversationsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async upsert(orgId: string, customerId: string): Promise<Conversation> {
    if (this.supabase.client) {
      // find existing open conversation for customer
      const { data: existing } = await this.supabase.client
        .from("conversations")
        .select()
        .eq("organization_id", orgId)
        .eq("customer_id", customerId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (existing) {
        const r = existing as Record<string, unknown>;
        return {
          id: String(r.id),
          organizationId: String(r.organization_id),
          customerId: String(r.customer_id),
          status: r.status as Conversation["status"],
          assignedUserId: (r.assigned_user_id as string | null) ?? null,
          lastMessageAt: (r.last_message_at as string | null) ?? null,
          unreadCount: Number(r.unread_count ?? 0),
          createdAt: String(r.created_at),
        };
      }
      const { data, error } = await this.supabase.client
        .from("conversations")
        .insert({ organization_id: orgId, customer_id: customerId })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? "conversation insert failed");
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        organizationId: String(r.organization_id),
        customerId: String(r.customer_id),
        status: r.status as Conversation["status"],
        assignedUserId: (r.assigned_user_id as string | null) ?? null,
        lastMessageAt: (r.last_message_at as string | null) ?? null,
        unreadCount: Number(r.unread_count ?? 0),
        createdAt: String(r.created_at),
      };
    }

    const existing = [...this.memory.conversations.values()].find(
      (c) => c.organizationId === orgId && c.customerId === customerId,
    );
    if (existing) return existing;
    const c: Conversation = {
      id: this.memory.id(),
      organizationId: orgId,
      customerId,
      status: "bot",
      assignedUserId: null,
      lastMessageAt: null,
      unreadCount: 0,
      createdAt: this.memory.now(),
    };
    this.memory.conversations.set(c.id, c);
    return c;
  }

  async list(orgId: string, status?: string, q?: string): Promise<Conversation[]> {
    if (this.supabase.client) {
      let query = this.supabase.client
        .from("conversations")
        .select()
        .eq("organization_id", orgId)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (status) query = query.eq("status", status);
      const { data, error } = await query.limit(100);
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        organizationId: String(r.organization_id),
        customerId: String(r.customer_id),
        status: r.status as Conversation["status"],
        assignedUserId: (r.assigned_user_id as string | null) ?? null,
        lastMessageAt: (r.last_message_at as string | null) ?? null,
        unreadCount: Number(r.unread_count ?? 0),
        createdAt: String(r.created_at),
      }));
    }
    let items = [...this.memory.conversations.values()].filter((c) => c.organizationId === orgId);
    if (status) items = items.filter((c) => c.status === status);
    return items;
  }

  async findById(orgId: string, id: string): Promise<Conversation | null> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("conversations")
        .select()
        .eq("organization_id", orgId)
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        organizationId: String(r.organization_id),
        customerId: String(r.customer_id),
        status: r.status as Conversation["status"],
        assignedUserId: (r.assigned_user_id as string | null) ?? null,
        lastMessageAt: (r.last_message_at as string | null) ?? null,
        unreadCount: Number(r.unread_count ?? 0),
        createdAt: String(r.created_at),
      };
    }
    const c = this.memory.conversations.get(id);
    return c && c.organizationId === orgId ? c : null;
  }

  async updateStatus(orgId: string, id: string, status: Conversation["status"]): Promise<Conversation | null> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("conversations")
        .update({ status })
        .eq("organization_id", orgId)
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return null;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        organizationId: String(r.organization_id),
        customerId: String(r.customer_id),
        status: r.status as Conversation["status"],
        assignedUserId: (r.assigned_user_id as string | null) ?? null,
        lastMessageAt: (r.last_message_at as string | null) ?? null,
        unreadCount: Number(r.unread_count ?? 0),
        createdAt: String(r.created_at),
      };
    }
    const c = this.memory.conversations.get(id);
    if (!c || c.organizationId !== orgId) return null;
    c.status = status;
    return c;
  }
}
