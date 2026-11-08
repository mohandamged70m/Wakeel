import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";
import type { Escalation } from "../types.js";

@Injectable()
export class EscalationsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async create(input: {
    organizationId: string;
    conversationId?: string | null;
    customerId?: string | null;
    reason: string;
    summary?: string | null;
  }): Promise<Escalation> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("escalations")
        .insert({
          organization_id: input.organizationId,
          conversation_id: input.conversationId ?? null,
          customer_id: input.customerId ?? null,
          reason: input.reason,
          summary: input.summary ?? null,
        })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? "escalation insert failed");
      const r = data as Record<string, unknown>;
      return this.map(r);
    }
    const e: Escalation = {
      id: this.memory.id(),
      organizationId: input.organizationId,
      conversationId: input.conversationId ?? null,
      customerId: input.customerId ?? null,
      reason: input.reason,
      summary: input.summary ?? null,
      status: "open",
      createdAt: this.memory.now(),
    };
    this.memory.escalations.set(e.id, e);
    return e;
  }

  async list(orgId: string, status?: string): Promise<Escalation[]> {
    if (this.supabase.client) {
      let q = this.supabase.client
        .from("escalations")
        .select()
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status);
      const { data } = await q.limit(100);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => this.map(r));
    }
    let items = [...this.memory.escalations.values()].filter((e) => e.organizationId === orgId);
    if (status) items = items.filter((e) => e.status === status);
    return items;
  }

  private map(r: Record<string, unknown>): Escalation {
    return {
      id: String(r.id),
      organizationId: String(r.organization_id),
      conversationId: (r.conversation_id as string | null) ?? null,
      customerId: (r.customer_id as string | null) ?? null,
      reason: String(r.reason),
      summary: (r.summary as string | null) ?? null,
      status: (r.status as "open" | "resolved") ?? "open",
      createdAt: String(r.created_at),
    };
  }
}