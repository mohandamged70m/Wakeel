import { Injectable } from "@nestjs/common";
import type * as T from "./types.js";

// lightweight uuid fallback if uuid not installed
function newId(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { randomUUID } = require("node:crypto");
    return randomUUID();
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

@Injectable()
export class MemoryStore {
  organizations = new Map<string, T.Organization>();
  users = new Map<string, T.User>();
  whatsappAccounts = new Map<string, T.WhatsAppAccount>();
  customers = new Map<string, T.Customer>();
  conversations = new Map<string, T.Conversation>();
  messages = new Map<string, T.Message>();
  messageIds = new Set<string>(); // whatsapp_message_id dedup
  menuCategories = new Map<string, T.MenuCategory>();
  menuItems = new Map<string, T.MenuItem>();
  orders = new Map<string, T.Order>();
  orderItems = new Map<string, T.OrderItem>();
  automations = new Map<string, T.Automations>();
  escalations = new Map<string, T.Escalation>();

  // helpers
  id(): string {
    return newId();
  }

  now(): string {
    return new Date().toISOString();
  }

  seedDevOrg(): string {
    const orgId = "00000000-0000-0000-0000-000000000000";
    if (!this.organizations.has(orgId)) {
      this.organizations.set(orgId, {
        id: orgId,
        name: "Demo Org",
        slug: "demo",
        timezone: "Africa/Cairo",
        currency: "EGP",
        locale: "ar",
      });
    }
    // default whatsapp account for instance "main"
    const accKey = `main`;
    if (![...this.whatsappAccounts.values()].some((a) => a.instanceName === "main")) {
      this.whatsappAccounts.set(newId(), {
        id: newId(),
        organizationId: orgId,
        provider: "evolution",
        instanceName: "main",
        phoneNumberId: null,
        status: "connected",
      });
    }
    if (!this.automations.has(orgId)) {
      this.automations.set(orgId, {
        organizationId: orgId,
        autoReplyEnabled: true,
        businessHours: null,
        urgentKeywords: ["urgent", "emergency", "عاجل"],
        awayMessage: null,
        personaPrompt: null,
        updatedAt: this.now(),
      });
    }
    return orgId;
  }
}