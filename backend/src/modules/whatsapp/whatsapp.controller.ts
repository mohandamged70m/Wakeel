import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { WhatsAppService } from "./whatsapp.service.js";
import { QueueService, ProcessMessagePayload } from "./queue.service.js";
import { WhatsAppAccountsRepository } from "../data/repositories/whatsapp-accounts.repository.js";
import { CustomersRepository } from "../data/repositories/customers.repository.js";
import { ConversationsRepository } from "../data/repositories/conversations.repository.js";
import { MessagesRepository } from "../data/repositories/messages.repository.js";

@ApiTags("webhooks")
@Controller("webhooks/whatsapp")
export class WhatsAppController {
  constructor(
    private readonly whatsapp: WhatsAppService,
    private readonly queue: QueueService,
    private readonly accounts: WhatsAppAccountsRepository,
    private readonly customers: CustomersRepository,
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async receive(@Headers() headers: Record<string, string | undefined>, @Body() body: unknown) {
    const provider = this.whatsapp.getProvider();
    const raw = JSON.stringify(body ?? {});
    const headerMap: Record<string, string | undefined> = headers;
    if (!provider.verifyWebhook(headerMap, raw)) {
      throw new UnauthorizedException("Invalid webhook token");
    }

    const normalized = provider.parseWebhook(raw);
    let accepted = 0;
    for (const m of normalized) {
      if (m.fromMe) continue;
      if (m.from.includes("@g.us")) continue;

      const orgId = await this.accounts.resolveOrg(m.instanceOrPhoneId);
      if (!orgId) continue;

      const customer = await this.customers.upsert(orgId, m.from, m.pushName);
      const conversation = await this.conversations.upsert(orgId, customer.id);

      const { inserted, message } = await this.messages.insert({
        organizationId: orgId,
        conversationId: conversation.id,
        whatsappMessageId: m.whatsappMessageId || null,
        direction: "in",
        senderType: "customer",
        type: m.type || "text",
        content: m.text ?? null,
      });

      if (!inserted) continue;

      const payload: ProcessMessagePayload = {
        organizationId: orgId,
        conversationId: conversation.id,
        messageId: message?.id,
        from: m.from,
        text: m.text,
        instanceOrPhoneId: m.instanceOrPhoneId,
        whatsappMessageId: m.whatsappMessageId,
        type: m.type || "text",
      };
      await this.queue.enqueue(payload);
      accepted++;
    }
    return { received: accepted };
  }

  @Get("health")
  @ApiOperation({ summary: "WhatsApp provider health" })
  async health() {
    return this.whatsapp.getProvider().health();
  }
}
