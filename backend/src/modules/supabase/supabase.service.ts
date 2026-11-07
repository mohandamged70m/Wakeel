import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  readonly client: SupabaseClient | null;
  readonly anonClient: SupabaseClient | null;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>("SUPABASE_URL");
    const serviceKey = this.config.get<string>("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = this.config.get<string>("SUPABASE_ANON_KEY");

    if (url && serviceKey) {
      this.client = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      this.client = null;
      this.logger.warn("SUPABASE_SERVICE_ROLE_KEY missing; running without Supabase (in-memory dev mode)");
    }

    if (url && anonKey) {
      this.anonClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
    } else {
      this.anonClient = null;
    }
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }
}