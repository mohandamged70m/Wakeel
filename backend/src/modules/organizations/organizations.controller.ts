import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";

@ApiTags("organizations")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("organizations")
export class OrganizationsController {
  @Get("me")
  @ApiOperation({ summary: "Current organization (placeholder)" })
  me(@Req() req: Request & { user: AuthUser }) {
    return { organizationId: req.user.organizationId };
  }
}
