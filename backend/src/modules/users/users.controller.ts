import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("users")
export class UsersController {
  @Get("me")
  @ApiOperation({ summary: "Current user" })
  me(@Req() req: Request & { user: AuthUser }) {
    return { id: req.user.id, role: req.user.role };
  }
}
