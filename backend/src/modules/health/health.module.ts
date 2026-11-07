import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { SupabaseModule } from "../supabase/supabase.module.js";
import { WhatsAppModule } from "../whatsapp/whatsapp.module.js";
import { AppHealthIndicator } from "./health.indicator.js";
import { HealthController } from "./health.controller.js";

@Module({
  imports: [TerminusModule, SupabaseModule, WhatsAppModule],
  controllers: [HealthController],
  providers: [AppHealthIndicator],
})
export class HealthModule {}