import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import { z } from "zod";
import { CustomersRepository } from "../data/repositories/customers.repository.js";
import { ConversationsRepository } from "../data/repositories/conversations.repository.js";
import { MessagesRepository, InsertMessageInput } from "../data/repositories/messages.repository.js";
import { MenuRepository } from "../data/repositories/menu.repository.js";
import { OrdersRepository } from "../data/repositories/orders.repository.js";
import { AutomationsRepository } from "../data/repositories/automations.repository.js";
import { EscalationsRepository } from "../data/repositories/escalations.repository.js";
import type { Customer, MenuItem } from "../data/types.js";

const ToolArgs = {
  getPrice: z.object({ itemIds: z.array(z.string()).min(1) }),
  getMenu: z.object({ category: z.string().optional() }),
  getCustomerHistory: z.object({ phone: z.string() }),
  createOrderDraft: z.object({
    phone: z.string(),
    name: z.string().optional(),
    items: z.array(z.object({ menuItemId: z.string(), qty: z.number().int().positive() })),
    notes: z.string().optional(),
  }),
  escalateToOwner: z.object({ reason: z.string(), summary: z.string().optional() }),
  get_menu_item: z.object({ name: z.string() }),
  search_menu: z.object({ query: z.string() }),
  get_customer_history: z.object({ phone: z.string() }),
  create_order_draft: z.object({
    phone: z.string(),
    name: z.string().optional(),
    items: z.array(z.object({ menuItemId: z.string(), qty: z.number().int().positive() })),
    notes: z.string().optional(),
  }),
  escalate_to_human: z.object({ reason: z.string(), summary: z.string().optional() }),
};

type ToolResult = { ok: boolean; data?: unknown; error?: string };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private client: OpenAI | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly customers: CustomersRepository,
    private readonly conversations: ConversationsRepository,
    private readonly messages: MessagesRepository,
    private readonly menu: MenuRepository,
    private readonly orders: OrdersRepository,
    private readonly automations: AutomationsRepository,
    private readonly escalations: EscalationsRepository,
  ) {}

  private getClient(): OpenAI | null {
    if (this.client) return this.client;
    const key = this.config.get<string>("OPENAI_API_KEY");
    if (!key) {
      this.logger.warn("OPENAI_API_KEY missing; AI agent disabled");
      return null;
    }
    this.client = new OpenAI({ apiKey: key });
    return this.client;
  }

  // exposed for tests
  setOpenAIClient(c: OpenAI | null): void {
    this.client = c;
  }

  private model(): string {
    return this.config.get<string>("OPENAI_CHAT_MODEL") ?? "gpt-4o-mini";
  }

  private toolDefs() {
    return [
      {
        type: "function" as const,
        function: {
          name: "getMenu",
          description: "Fetch the organization menu (optionally filtered by category). Returns items with prices from DB. Use for menu browse/price questions.",
          parameters: {
            type: "object",
            properties: { category: { type: "string", description: "Category name (e.g. Drinks). Omit for all." } },
            additionalProperties: false,
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "getPrice",
          description: "Fetch exact prices for given menu item ids from DB. Use whenever a price is needed; never guess prices.",
          parameters: {
            type: "object",
            properties: { itemIds: { type: "array", items: { type: "string" }, minItems: 1 } },
            required: ["itemIds"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "getCustomerHistory",
          description: "Fetch prior orders/messages for a customer phone.",
          parameters: {
            type: "object",
            properties: { phone: { type: "string" } },
            required: ["phone"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "createOrderDraft",
          description: "Create an order draft (status draft_pending_owner). Does NOT confirm; owner must approve. Use only after customer confirms.",
          parameters: {
            type: "object",
            properties: {
              phone: { type: "string" },
              name: { type: "string" },
              items: {
                type: "array",
                items: { type: "object", properties: { menuItemId: { type: "string" }, qty: { type: "integer", minimum: 1 } }, required: ["menuItemId", "qty"] },
                minItems: 1,
              },
              notes: { type: "string" },
            },
            required: ["phone", "items"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "escalateToOwner",
          description: "Escalate the conversation to the human owner (complaint, urgent, human request, etc.).",
          parameters: {
            type: "object",
            properties: { reason: { type: "string" }, summary: { type: "string" } },
            required: ["reason"],
            additionalProperties: false,
          },
        },
      },
      // aliases matching assignment naming
      {
        type: "function" as const,
        function: {
          name: "get_menu_item",
          description: "Alias: look up a single menu item by name and return its DB price. Prefer getPrice/getMenu.",
          parameters: { type: "object", properties: { name: { type: "string" } }, required: ["name"], additionalProperties: false },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "search_menu",
          description: "Alias: search menu by query text. Prefer getMenu.",
          parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "get_customer_history",
          description: "Alias for getCustomerHistory.",
          parameters: { type: "object", properties: { phone: { type: "string" } }, required: ["phone"], additionalProperties: false },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "create_order_draft",
          description: "Alias for createOrderDraft.",
          parameters: {
            type: "object",
            properties: {
              phone: { type: "string" },
              name: { type: "string" },
              items: { type: "array", items: { type: "object", properties: { menuItemId: { type: "string" }, qty: { type: "integer", minimum: 1 } }, required: ["menuItemId", "qty"] }, minItems: 1 },
              notes: { type: "string" },
            },
            required: ["phone", "items"],
            additionalProperties: false,
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "escalate_to_human",
          description: "Alias for escalateToOwner.",
          parameters: { type: "object", properties: { reason: { type: "string" }, summary: { type: "string" } }, required: ["reason"], additionalProperties: false },
        },
      },
    ];
  }

  async transcribeAudio(buffer: Buffer, filename = "audio.ogg"): Promise<string> {
    const client = this.getClient();
    if (!client) return "";
    try {
      const file = new File([new Uint8Array(buffer)], filename, { type: "audio/ogg" });
      const res = await client.audio.transcriptions.create({ file, model: "whisper-1" });
      return (res as { text?: string }).text ?? "";
    } catch (err) {
      this.logger.error(`whisper failed: ${err instanceof Error ? err.message : String(err)}`);
      return "";
    }
  }

  private async runTool(orgId: string, conversationId: string, customerId: string | null, customerPhone: string, name: string, args: unknown): Promise<ToolResult> {
    try {
      switch (name) {
        case "getMenu":
        case "search_menu": {
          let category: string | undefined;
          if (name === "getMenu") category = ToolArgs.getMenu.parse(args).category;
          else {
            const q = ToolArgs.search_menu.parse(args).query;
            // search by query: filter items by name contains
            const items = await this.menu.listItems(orgId);
            const filtered = items.filter((i) =>
              `${i.nameEn} ${i.nameAr ?? ""}`.toLowerCase().includes(q.toLowerCase()),
            );
            return { ok: true, data: this.formatMenuItems(filtered) };
          }
          const items = await this.menu.listItems(orgId, undefined);
          const filtered = category
            ? items.filter((i) => {
                // category filter by name match via categories
                return true; // resolved below
              })
            : items;
          // resolve category id/name: fetch categories
          const cats = await this.menu.listCategories(orgId);
          let catId: string | null = null;
          if (category) {
            const c = cats.find((x) => x.nameEn.toLowerCase() === category.toLowerCase() || x.nameAr === category);
            catId = c?.id ?? null;
          }
          let result = items;
          if (catId) result = items.filter((i) => i.categoryId === catId);
          else if (category) {
            // try name contains
            result = items.filter((i) => true);
            // if category string matches a category name, filter; else return all
            const cat = cats.find((x) => x.nameEn.toLowerCase().includes(category.toLowerCase()));
            if (cat) result = items.filter((i) => i.categoryId === cat.id);
          }
          // only available? menu browse includes available flag; keep all but mark
          return { ok: true, data: this.formatMenuItems(result) };
        }
        case "getPrice":
        case "get_menu_item": {
          if (name === "get_menu_item") {
            const { name: itemName } = ToolArgs.get_menu_item.parse(args);
            const items = await this.menu.listItems(orgId);
            const found = items.filter((i) => i.nameEn.toLowerCase().includes(itemName.toLowerCase()) || (i.nameAr ?? "").includes(itemName));
            return { ok: true, data: this.formatMenuItems(found.length ? found : items) };
          }
          const { itemIds } = ToolArgs.getPrice.parse(args);
          const out: unknown[] = [];
          for (const id of itemIds) {
            const it = await this.menu.getItem(orgId, id);
            if (it) out.push(this.formatItem(it));
          }
          // if none found by id, maybe ids are names; fallback search
          if (out.length === 0) {
            const items = await this.menu.listItems(orgId);
            for (const id of itemIds) {
              const found = items.filter((i) => i.id === id || i.nameEn.toLowerCase().includes(id.toLowerCase()));
              for (const f of found) out.push(this.formatItem(f));
            }
          }
          return { ok: true, data: out };
        }
        case "getCustomerHistory":
        case "get_customer_history": {
          const { phone } = (name === "getCustomerHistory" ? ToolArgs.getCustomerHistory : ToolArgs.get_customer_history).parse(args);
          const c = await this.customers.findByPhone(orgId, phone);
          if (!c) return { ok: true, data: { customer: null, orders: [] } };
          const orders = await this.orders.list(orgId);
          const co = orders.filter((o) => o.customerId === c.id);
          return { ok: true, data: { customer: c, orders: co } };
        }
        case "createOrderDraft":
        case "create_order_draft": {
          const parsed = (name === "createOrderDraft" ? ToolArgs.createOrderDraft : ToolArgs.create_order_draft).parse(args);
          const cust = await this.customers.upsert(orgId, parsed.phone, parsed.name);
          // resolve items with prices from DB
          const resolved: { menuItemId?: string | null; nameSnapshot: string; priceSnapshot: number; qty: number }[] = [];
          for (const it of parsed.items) {
            const mi = await this.menu.getItem(orgId, it.menuItemId);
            if (!mi) {
              // try find by name
              const all = await this.menu.listItems(orgId);
              const found = all.find((x) => x.id === it.menuItemId || x.nameEn.toLowerCase().includes(it.menuItemId.toLowerCase()));
              if (!found) return { ok: false, error: `menu item not found: ${it.menuItemId}` };
              resolved.push({ menuItemId: found.id, nameSnapshot: found.nameEn, priceSnapshot: found.price, qty: it.qty });
            } else {
              if (!mi.available) return { ok: false, error: `${mi.nameEn} is unavailable` };
              resolved.push({ menuItemId: mi.id, nameSnapshot: mi.nameEn, priceSnapshot: mi.price, qty: it.qty });
            }
          }
          const currency = (await this.menu.listItems(orgId))[0]?.currency ?? "EGP";
          const order = await this.orders.create(orgId, cust.id, conversationId, currency, resolved, parsed.notes ?? null);
          // create approval row (best-effort via supabase)
          return { ok: true, data: { orderId: order.id, status: order.status, total: order.total, currency: order.currency } };
        }
        case "escalateToOwner":
        case "escalate_to_human": {
          const parsed = (name === "escalateToOwner" ? ToolArgs.escalateToOwner : ToolArgs.escalate_to_human).parse(args);
          const esc = await this.escalations.create({
            organizationId: orgId,
            conversationId,
            customerId,
            reason: parsed.reason,
            summary: parsed.summary ?? null,
          });
          return { ok: true, data: { escalationId: esc.id, reason: esc.reason } };
        }
        default:
          return { ok: false, error: `unknown tool ${name}` };
      }
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  private formatItem(i: MenuItem) {
    return { id: i.id, nameEn: i.nameEn, nameAr: i.nameAr, price: i.price, currency: i.currency, available: i.available };
  }

  private formatMenuItems(items: MenuItem[]) {
    return items.map((i) => this.formatItem(i));
  }

  async processInbound(payload: {
    organizationId?: string;
    conversationId?: string;
    messageId?: string;
    from: string;
    text?: string;
    instanceOrPhoneId: string;
    whatsappMessageId?: string;
    type?: string;
    mediaUrl?: string | null;
  }): Promise<{ reply: string | null; escalated: boolean; escalatedReason?: string }> {
    const orgId = payload.organizationId;
    const conversationId = payload.conversationId;
    if (!orgId || !conversationId) {
      this.logger.warn("missing org/conversation; skipping");
      return { reply: null, escalated: false };
    }

    // resolve customer
    const customer = await this.customers.upsert(orgId, payload.from, undefined);

    // transcribe if audio
    let userText = payload.text ?? "";
    const contentType = payload.type ?? "text";
    if (!userText && (contentType === "audio" || contentType === "ptt")) {
      if (payload.mediaUrl) {
        const buf = await fetch(payload.mediaUrl).then((r) => r.arrayBuffer()).then((b) => Buffer.from(b)).catch(() => null);
        if (buf) {
          const t = await this.transcribeAudio(buf);
          if (t) userText = t;
        }
      }
    }
    if (!userText) userText = payload.text ?? "";

    // persist user message if not already (webhook already did; ensure)
    // policy checks
    const auto = await this.automations.get(orgId);
    const conv = await this.conversations.findById(orgId, conversationId);

    // auto reply disabled
    if (auto.autoReplyEnabled === false) {
      const esc = await this.escalations.create({ organizationId: orgId, conversationId, customerId: customer.id, reason: "auto_reply_off", summary: "auto reply disabled" });
      await this.conversations.updateStatus(orgId, conversationId, "human");
      return { reply: "Thanks! Our team will get back to you shortly.", escalated: true, escalatedReason: "auto_reply_off" };
    }

    // business hours
    const bh = auto.businessHours as { start?: string; end?: string } | null;
    if (bh && bh.start && bh.end) {
      const now = new Date();
      const tz = "Africa/Cairo"; // org timezone could be loaded; default
      const hourMin = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
      const [hh, mm] = hourMin.split(":").map(Number);
      const mins = hh * 60 + mm;
      const [sh, sm] = bh.start.split(":").map(Number);
      const [eh, em] = bh.end.split(":").map(Number);
      const startM = sh * 60 + sm;
      const endM = eh * 60 + em;
      if (mins < startM || mins > endM) {
        await this.escalations.create({ organizationId: orgId, conversationId, customerId: customer.id, reason: "outside_hours", summary: "outside business hours" });
        const away = auto.awayMessage ?? "We're currently closed. We'll reply during business hours.";
        return { reply: away, escalated: true, escalatedReason: "outside_hours" };
      }
    }

    // urgent keywords
    const lower = userText.toLowerCase();
    const urgent = (auto.urgentKeywords ?? []).some((k) => lower.includes(String(k).toLowerCase()));
    if (urgent) {
      await this.escalations.create({ organizationId: orgId, conversationId, customerId: customer.id, reason: "urgent_keyword", summary: userText.slice(0, 200) });
    }

    // complaint detection (simple)
    const complaintWords = ["refund", "cold", "terrible", "awful", "hair", "complaint"];
    if (complaintWords.some((w) => lower.includes(w))) {
      await this.escalations.create({ organizationId: orgId, conversationId, customerId: customer.id, reason: "complaint", summary: userText.slice(0, 200) });
    }

    // human handoff request
    const humanReq = /speak to a human|talk to (a )?human|agent please|human agent/i.test(userText);
    if (humanReq) {
      await this.escalations.create({ organizationId: orgId, conversationId, customerId: customer.id, reason: "human_requested", summary: userText.slice(0, 200) });
      await this.conversations.updateStatus(orgId, conversationId, "human");
    }

    // new customer escalation
    const priorMsgs = await this.messages.listByConversation(orgId, conversationId, 5);
    // if only the current one (or none), treat as new customer
    const isNewCustomer = priorMsgs.filter((m) => m.direction === "in").length <= 1;
    if (isNewCustomer) {
      await this.escalations.create({ organizationId: orgId, conversationId, customerId: customer.id, reason: "new_customer", summary: null });
    }

    // if conversation already human (and not this turn's handoff), send owner-will-reply
    if (conv?.status === "human" && !humanReq) {
      // still allow agent? For safety, let agent reply but mark escalated? 
      // We'll let agent run but not create orders.
    }

    // system prompt
    const persona = auto.personaPrompt ?? "";
    const orgName = "the restaurant";
    const system = [
      "You are a helpful WhatsApp ordering assistant for " + orgName + ".",
      "You speak Arabic and English; reply in the customer's language.",
      "CRITICAL: Prices MUST come only from tool results (getMenu/getPrice). Never state a price from memory.",
      "When a customer asks for a price, call getPrice or getMenu first, then quote the returned values.",
      "For orders: confirm items and total with customer first; only call createOrderDraft after explicit confirmation. Orders are drafts pending owner approval; never say an order is confirmed.",
      "If an item is unavailable (available=false), say it is sold out and do not add it to an order.",
      "For complaints, urgent issues, or human requests, call escalateToOwner.",
      persona,
    ].filter(Boolean).join("\n");

    // load history
    const history = await this.messages.listByConversation(orgId, conversationId, 20);
    const chatMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      { role: "system", content: system },
    ];
    for (const m of history) {
      if (m.id === payload.messageId) continue; // avoid duplicating? we'll include all then append current? 
    }
    // build from history (excluding the just-inserted user msg? it's included). We'll just use last 20 including current.
    // Actually rebuild: system + prior messages mapped
    const mapped: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
    for (const m of history) {
      if (m.direction === "in") mapped.push({ role: "user", content: m.content ?? "" });
      else mapped.push({ role: "assistant", content: m.content ?? "" });
    }
    // If userText differs from stored (transcript), append/replace last user
    if (userText && mapped.length && mapped[mapped.length - 1].role === "user") {
      mapped[mapped.length - 1] = { role: "user", content: userText };
    } else if (userText) {
      mapped.push({ role: "user", content: userText });
    }
    chatMessages.push(...mapped);

    const client = this.getClient();
    if (!client) {
      return { reply: "Sorry, AI is not configured.", escalated: false };
    }

    let reply = "";
    let escalated = humanReq || urgent || complaintWords.some((w) => lower.includes(w));
    const maxIter = 6;
    for (let i = 0; i < maxIter; i++) {
      const res = await client.chat.completions.create({
        model: this.model(),
        messages: chatMessages,
        tools: this.toolDefs(),
        tool_choice: "auto",
      });
      const choice = res.choices?.[0];
      const msg = choice?.message;
      if (!msg) break;
      if (msg.tool_calls && msg.tool_calls.length > 0) {
        chatMessages.push(msg as OpenAI.Chat.Completions.ChatCompletionMessageParam);
        for (const tc of msg.tool_calls) {
          if (tc.type !== "function") continue;
          const fn = tc.function;
          let args: unknown = {};
          try { args = JSON.parse(fn.arguments || "{}"); } catch { args = {}; }
          const result = await this.runTool(orgId, conversationId, customer.id, payload.from, fn.name, args);
          if (fn.name === "escalateToOwner" || fn.name === "escalate_to_human") escalated = true;
          chatMessages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(result),
          });
        }
        continue;
      }
      reply = msg.content ?? "";
      break;
    }

    // persist assistant reply
    if (reply) {
      const insert: InsertMessageInput = {
        organizationId: orgId,
        conversationId,
        whatsappMessageId: null,
        direction: "out",
        senderType: "bot",
        type: "text",
        content: reply,
      };
      await this.messages.insert(insert);
    }

    if (humanReq) {
      await this.conversations.updateStatus(orgId, conversationId, "human");
    }

    return { reply: reply || null, escalated, escalatedReason: escalated ? "escalated" : undefined };
  }
}