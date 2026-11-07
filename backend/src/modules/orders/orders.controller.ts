import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { z } from "zod";
import { Request } from "express";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";
import { OrdersRepository } from "../data/repositories/orders.repository.js";
import { MenuRepository } from "../data/repositories/menu.repository.js";

const editSchema = z.object({
  items: z.array(
    z.object({
      menuItemId: z.string().uuid().nullable().optional(),
      nameSnapshot: z.string().min(1),
      priceSnapshot: z.number().nonnegative(),
      qty: z.number().int().positive(),
    }),
  ),
});

@ApiTags("orders")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(
    private readonly orders: OrdersRepository,
    private readonly menu: MenuRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: "List orders" })
  async list(@Req() req: Request & { user: AuthUser }, @Query("status") status?: string) {
    const items = await this.orders.list(req.user.organizationId, status);
    return { items };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get order detail" })
  async get(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const orgId = req.user.organizationId;
    const order = await this.orders.findById(orgId, id);
    const items = order ? await this.orders.listItems(order.id) : [];
    return { ...order, items };
  }

  @Post(":id/approve")
  @ApiOperation({ summary: "Approve order" })
  async approve(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const updated = await this.orders.updateStatus(req.user.organizationId, id, "confirmed");
    return updated;
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject order" })
  async reject(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const updated = await this.orders.updateStatus(req.user.organizationId, id, "rejected");
    return updated;
  }

  @Post(":id/edit")
  @ApiOperation({ summary: "Edit order items" })
  async edit(
    @Req() req: Request & { user: AuthUser },
    @Param("id") id: string,
    @Body({ schema: editSchema }) body: z.infer<typeof editSchema>,
  ) {
    // For MVP, status stays; price recompute would happen here. Keep simple.
    return { id, items: body.items };
  }
}
