import { Injectable } from "@nestjs/common";
import { HealthIndicatorService, HealthIndicatorResult } from "@nestjs/terminus";
import { ConfigService } from "@nestjs/config";
import { SupabaseService } from "../supabase/supabase.service.js";
import { WhatsAppService } from "../whatsapp/whatsapp.service.js";

@Injectable()
export class AppHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly whatsapp: WhatsAppService,
  ) {}

  async checkDb(): Promise<HealthIndicatorResult> {
    const session = this.healthIndicatorService.check("database");
    if (!this.supabase.client) {
      return session.up({ detail: "not configured (in-memory mode)" });
    }
    try {
      const { error } = await this.supabase.client.from("organizations").select("id").limit(1);
      if (error) throw error;
      return session.up();
    } catch (err) {
      return session.down({ message: String(err) });
    }
  }

  async checkRedis(): Promise<HealthIndicatorResult> {
    const session = this.healthIndicatorService.check("redis");
    const url = this.config.get<string>("REDIS_URL");
    if (!url) {
      return session.up({ detail: "not configured (inline mode)" });
    }
    return session.up({ url });
  }

  async checkEvolution(): Promise<HealthIndicatorResult> {
    const session = this.healthIndicatorService.check("evolution");
    try {
      const h = await this.whatsapp.getProvider().health();
      return session.up({ state: h.state, connected: h.connected });
    } catch (err) {
      return session.down({ message: String(err) });
    }
  }
}
