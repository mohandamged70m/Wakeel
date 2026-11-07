import { Controller, Get, Param, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";
import { CustomersRepository } from "../data/repositories/customers.repository.js";
import { OrdersRepository } from "../data/repositories/orders.repository.js";
import { ConversationsRepository } from "../data/repositories/conversations.repository.js";

@ApiTags("customers")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("customers")
export class CustomersController {
  constructor(
    private readonly customers: CustomersRepository,
    private readonly orders: OrdersRepository,
    private readonly conversations: ConversationsRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: "List customers" })
  async list(@Req() req: Request & { user: AuthUser }, @Query("cursor") cursor?: string) {
    const items = await this.customers.list(req.user.organizationId);
    return { items, nextCursor: null };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get customer detail" })
  async get(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const orgId = req.user.organizationId;
    const customer = await this.customers.findById(orgId, id);
    const orders = customer ? await this.orders.list(orgId) : [];
    const convs = customer ? await this.conversations.list(orgId) : [];
    return { customer, orders: orders.filter((o) => o.customerId === id), conversations: convs.filter((c) => c.customerId === id) };
  }
}
