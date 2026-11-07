import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { WhatsAppService } from "./whatsapp.service.js";

@ApiTags("health")
@Controller("health")
export class WhatsAppHealthController {
  constructor(private readonly whatsapp: WhatsAppService) {}

  @Get("whatsapp")
  @ApiOperation({ summary: "WhatsApp provider health" })
  async health() {
    return this.whatsapp.getProvider().health();
  }
}
