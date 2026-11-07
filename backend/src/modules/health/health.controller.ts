import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { WhatsAppService } from "../whatsapp/whatsapp.service.js";
import { AppHealthIndicator } from "./health.indicator.js";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicator: AppHealthIndicator,
    private readonly whatsapp: WhatsAppService,
  ) {}

  @Get("whatsapp")
  @ApiOperation({ summary: "WhatsApp connection status" })
  async whatsappStatus() {
    const h = await this.whatsapp.getProvider().health();
    return { connected: h.connected, state: h.state, lastSeen: null };
  }
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: "Service health" })
  check() {
    return this.health.check([
      () => this.indicator.checkDb(),
      () => this.indicator.checkRedis(),
      () => this.indicator.checkEvolution(),
    ]);
  }
}