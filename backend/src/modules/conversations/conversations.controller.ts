import { Controller, Get, Param, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { z } from "zod";
import { SupabaseAuthGuard, type AuthUser } from "../../common/guards/supabase-auth.guard.js";
import { ConversationsRepository } from "../data/repositories/conversations.repository.js";
import { CustomersRepository } from "../data/repositories/customers.repository.js";
import { MessagesRepository } from "../data/repositories/messages.repository.js";
import type { Conversation } from "../data/types.js";

const takeoverSchema = z.object({}).optional();

@ApiTags("conversations")
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller("conversations")
export class ConversationsController {
  constructor(
    private readonly conversations: ConversationsRepository,
    private readonly customers: CustomersRepository,
    private readonly messages: MessagesRepository,
  ) {}

  @Get()
  @ApiOperation({ summary: "List conversations" })
  async list(@Req() req: Request & { user: AuthUser }, @Query("status") status?: string, @Query("q") q?: string) {
    const orgId = req.user.organizationId;
    const items = await this.conversations.list(orgId, status, q);
    const enriched = await Promise.all(
      items.map(async (c) => {
        const customer = await this.customers.findById(orgId, c.customerId);
        const msgs = await this.messages.listByConversation(orgId, c.id);
        const last = msgs[msgs.length - 1];
        return {
          ...c,
          customer: customer ? { id: customer.id, phone: customer.phone, name: customer.name } : null,
          lastMessagePreview: last?.content ?? null,
        };
      }),
    );
    return { items: enriched, nextCursor: null };
  }

  @Get(":id/messages")
  @ApiOperation({ summary: "List messages in a conversation" })
  async listMessages(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const orgId = req.user.organizationId;
    const items = await this.messages.listByConversation(orgId, id);
    return { items };
  }

  @Post(":id/takeover")
  @ApiOperation({ summary: "Take over conversation (human mode)" })
  async takeover(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const orgId = req.user.organizationId;
    const c = await this.conversations.updateStatus(orgId, id, "human");
    return { status: c?.status ?? "human" };
  }

  @Post(":id/return-to-bot")
  @ApiOperation({ summary: "Return conversation to bot" })
  async returnToBot(@Req() req: Request & { user: AuthUser }, @Param("id") id: string) {
    const orgId = req.user.organizationId;
    const c = await this.conversations.updateStatus(orgId, id, "bot");
    return { status: c?.status ?? "bot" };
  }
}
