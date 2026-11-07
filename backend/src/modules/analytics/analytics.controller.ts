import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";
import { ConversationsRepository } from "../data/repositories/conversations.repository.js";
import { OrdersRepository } from "../data/repositories/orders.repository.js";

@ApiTags("analytics")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("analytics")
export class AnalyticsController {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly orders: OrdersRepository,
  ) {}

  @Get("overview")
  @ApiOperation({ summary: "Analytics overview" })
  async overview(@Req() req: Request & { user: AuthUser }, @Query("range") range?: string) {
    const orgId = req.user.organizationId;
    const convs = await this.conversations.list(orgId);
    const orders = await this.orders.list(orgId);
    const pending = orders.filter((o) => o.status === "draft_pending_owner" || o.status === "confirmed" || o.status === "preparing" || o.status === "ready").length;
    const revenue = orders
      .filter((o) => o.status === "delivered")
      .reduce((s, o) => s + o.total, 0);
    return {
      conversationsToday: convs.length,
      ordersPending: pending,
      revenueThisWeek: revenue,
      avgFirstResponseSec: 0,
    };
  }
}
