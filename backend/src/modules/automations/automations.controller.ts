import { Body, Controller, Get, Put, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Request } from "express";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";
import { AutomationsRepository } from "../data/repositories/automations.repository.js";

const automationsSchema = z.object({
  autoReplyEnabled: z.boolean().optional(),
  businessHours: z.unknown().optional(),
  urgentKeywords: z.array(z.string()).optional(),
  awayMessage: z.string().nullable().optional(),
  personaPrompt: z.string().nullable().optional(),
});

@ApiTags("automations")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("automations")
export class AutomationsController {
  constructor(private readonly automations: AutomationsRepository) {}

  @Get()
  @ApiOperation({ summary: "Get automations settings" })
  async get(@Req() req: Request & { user: AuthUser }) {
    return this.automations.get(req.user.organizationId);
  }

  @Put()
  @ApiOperation({ summary: "Update automations settings" })
  async update(
    @Req() req: Request & { user: AuthUser },
    @Body({ schema: automationsSchema }) body: z.infer<typeof automationsSchema>,
  ) {
    return this.automations.upsert(req.user.organizationId, body);
  }
}
