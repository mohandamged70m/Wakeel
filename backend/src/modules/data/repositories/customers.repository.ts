import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";
import type { Customer } from "../types.js";

@Injectable()
export class CustomersRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async upsert(orgId: string, phone: string, name?: string): Promise<Customer> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("customers")
        .upsert(
          { organization_id: orgId, phone, name: name ?? null },
          { onConflict: "organization_id,phone" },
        )
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? "customer upsert failed");
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        organizationId: String(r.organization_id),
        phone: String(r.phone),
        name: (r.name as string | null) ?? null,
        language: String(r.language ?? "auto"),
        tags: (r.tags as string[]) ?? [],
        notes: (r.notes as string | null) ?? null,
        createdAt: String(r.created_at),
      };
    }

    const existing = [...this.memory.customers.values()].find(
      (c) => c.organizationId === orgId && c.phone === phone,
    );
    if (existing) {
      if (name && !existing.name) existing.name = name;
      return existing;
    }
    const c: Customer = {
      id: this.memory.id(),
      organizationId: orgId,
      phone,
      name: name ?? null,
      language: "auto",
      tags: [],
      notes: null,
      createdAt: this.memory.now(),
    };
    this.memory.customers.set(c.id, c);
    return c;
  }

  async findByPhone(orgId: string, phone: string): Promise<Customer | null> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("customers")
        .select()
        .eq("organization_id", orgId)
        .eq("phone", phone)
        .maybeSingle();
      if (error || !data) return null;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        organizationId: String(r.organization_id),
        phone: String(r.phone),
        name: (r.name as string | null) ?? null,
        language: String(r.language ?? "auto"),
        tags: (r.tags as string[]) ?? [],
        notes: (r.notes as string | null) ?? null,
        createdAt: String(r.created_at),
      };
    }
    return [...this.memory.customers.values()].find((c) => c.organizationId === orgId && c.phone === phone) ?? null;
  }

  async findById(orgId: string, id: string): Promise<Customer | null> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("customers")
        .select()
        .eq("organization_id", orgId)
        .eq("id", id)
        .maybeSingle();
      if (error || !data) return null;
      const r = data as Record<string, unknown>;
      return {
        id: String(r.id),
        organizationId: String(r.organization_id),
        phone: String(r.phone),
        name: (r.name as string | null) ?? null,
        language: String(r.language ?? "auto"),
        tags: (r.tags as string[]) ?? [],
        notes: (r.notes as string | null) ?? null,
        createdAt: String(r.created_at),
      };
    }
    const c = this.memory.customers.get(id);
    return c && c.organizationId === orgId ? c : null;
  }

  async list(orgId: string, limit = 50): Promise<Customer[]> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("customers")
        .select()
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error || !data) return [];
      return (data as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        organizationId: String(r.organization_id),
        phone: String(r.phone),
        name: (r.name as string | null) ?? null,
        language: String(r.language ?? "auto"),
        tags: (r.tags as string[]) ?? [],
        notes: (r.notes as string | null) ?? null,
        createdAt: String(r.created_at),
      }));
    }
    return [...this.memory.customers.values()]
      .filter((c) => c.organizationId === orgId)
      .slice(0, limit);
  }
}
