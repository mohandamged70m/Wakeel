import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";
import type { Automations } from "../types.js";

@Injectable()
export class AutomationsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async get(orgId: string): Promise<Automations> {
    if (this.supabase.client) {
      const { data } = await this.supabase.client
        .from("automations")
        .select()
        .eq("organization_id", orgId)
        .maybeSingle();
      if (data) {
        const r = data as Record<string, unknown>;
        return {
          organizationId: orgId,
          autoReplyEnabled: Boolean(r.auto_reply_enabled ?? false),
          businessHours: r.business_hours ?? null,
          urgentKeywords: (r.urgent_keywords as string[]) ?? [],
          awayMessage: (r.away_message as string | null) ?? null,
          personaPrompt: (r.persona_prompt as string | null) ?? null,
          updatedAt: (r.updated_at as string | null) ?? null,
        };
      }
      return {
        organizationId: orgId,
        autoReplyEnabled: false,
        businessHours: null,
        urgentKeywords: [],
        awayMessage: null,
        personaPrompt: null,
        updatedAt: null,
      };
    }
    if (!this.memory.automations.has(orgId)) {
      this.memory.automations.set(orgId, {
        organizationId: orgId,
        autoReplyEnabled: true,
        businessHours: null,
        urgentKeywords: ["urgent", "emergency", "عاجل"],
        awayMessage: null,
        personaPrompt: null,
        updatedAt: this.memory.now(),
      });
    }
    return this.memory.automations.get(orgId)!;
  }

  async upsert(orgId: string, patch: Partial<Automations>): Promise<Automations> {
    const current = await this.get(orgId);
    const next: Automations = { ...current, ...patch, organizationId: orgId, updatedAt: new Date().toISOString() };
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("automations")
        .upsert(
          {
            organization_id: orgId,
            auto_reply_enabled: next.autoReplyEnabled,
            business_hours: next.businessHours,
            urgent_keywords: next.urgentKeywords,
            away_message: next.awayMessage,
            persona_prompt: next.personaPrompt,
            updated_at: next.updatedAt,
          },
          { onConflict: "organization_id" },
        )
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? "automations upsert failed");
      return next;
    }
    this.memory.automations.set(orgId, next);
    return next;
  }
}
