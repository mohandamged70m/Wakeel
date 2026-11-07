import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";

@Injectable()
export class WhatsAppAccountsRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async resolveOrg(instanceName: string): Promise<string | null> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("whatsapp_accounts")
        .select("organization_id")
        .eq("instance_name", instanceName)
        .maybeSingle();
      if (error || !data) return null;
      return (data as { organization_id: string }).organization_id;
    }
    const acc = [...this.memory.whatsappAccounts.values()].find(
      (a) => a.instanceName === instanceName,
    );
    if (acc) return acc.organizationId;
    // dev fallback: seed and return default org
    return this.memory.seedDevOrg();
  }
}
