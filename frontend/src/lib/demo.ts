// Demo data adapter: maps src/lib/mock.seed.ts (the demo dataset) into the
// API types so the dashboard renders locally without a running backend.
// Used as a graceful fallback by lib/api.ts when the backend is unreachable.
import { chats, orders as seedOrders, clients, ordersLast7 } from "@/lib/mock.seed";
import type {
  Conversation,
  Message,
  Order,
  OrderDetail,
  OrderItem,
  Customer,
  AnalyticsOverview,
  WhatsappHealth,
  Automations,
} from "@/lib/types";

const TODAY = "2026-11-07";

function convStatus(chat: (typeof chats)[number]): Conversation["status"] {
  if (chat.tags.includes("complaint") || chat.tags.includes("askedForHuman")) return "human";
  return "bot";
}

export const demoConversations: Conversation[] = chats.map((c) => ({
  id: c.id,
  customerId: c.id,
  customer: { id: c.id, phone: c.phone, name: c.customer },
  status: convStatus(c),
  lastMessageAt: `${TODAY}T${c.time}:00`,
  unreadCount: c.unread ? 1 : 0,
  createdAt: `${TODAY}T${c.time}:00`,
  lastMessagePreview: c.lastMessage,
}));

const demoMessagesStore: Record<string, Message[]> = {};
for (const c of chats) {
  const msgs: Message[] = [];
  const customerText =
    c.lastMessage.startsWith("Voice note:") ? c.lastMessage.replace(/^Voice note:\s*/, "") : c.lastMessage;
  msgs.push({
    id: `${c.id}-m1`,
    conversationId: c.id,
    direction: "in",
    senderType: "customer",
    type: c.isVoice ? "audio" : "text",
    content: customerText.replace(/^['"]|['"]$/g, ""),
    mediaUrl: null,
    status: "delivered",
    createdAt: `${TODAY}T${c.time}:00`,
  });
  const reply =
    c.id === "c1"
      ? "تم إنشاء طلبك (ORD-1042): 2× شاورما دجاج + 1× حمص = 155 EGP. بانتظار تأكيدك."
      : c.id === "c2"
        ? "تم فهم رسالتك الصوتية: 3× فلافل راب. ما العنوان وما طريقة الدفع؟"
        : c.id === "c3"
          ? "سعر Mixed Grill هو 180 EGP (من الكتالوج، بدون تخمين)."
          : c.id === "c4"
            ? null
            : c.id === "c5"
              ? "تم تحويلك إلى شخص (owner notified). الوكيل متوقف على هذه المحادثة."
              : "تم.";
  if (reply) {
    msgs.push({
      id: `${c.id}-m2`,
      conversationId: c.id,
      direction: "out",
      senderType: c.id === "c4" ? "agent" : "bot",
      type: "text",
      content: reply,
      mediaUrl: null,
      status: "sent",
      createdAt: `${TODAY}T${c.time}:01`,
    });
  }
  if (c.id === "c4") {
    msgs.push({
      id: `${c.id}-m2`,
      conversationId: c.id,
      direction: "out",
      senderType: "agent",
      type: "system",
      content: "Complaint detected -> escalated to owner, no auto-reply sent.",
      mediaUrl: null,
      status: "sent",
      createdAt: `${TODAY}T${c.time}:01`,
    });
  }
  demoMessagesStore[c.id] = msgs;
}

export function demoMessages(id: string | null): { items: Message[] } {
  if (!id) return { items: [] };
  return { items: demoMessagesStore[id] ?? [] };
}

// --- orders ---
type DemoOrder = Order & { _items: OrderItem[]; customerName: string };

function mapStatus(s: string): Order["status"] {
  if (s === "new") return "draft_pending_owner";
  if (s === "out") return "ready";
  return s as Order["status"];
}

let demoOrdersStore: DemoOrder[] = seedOrders.map((o, i) => ({
  id: o.id,
  customerId: o.customer,
  customerName: o.customer,
  status: mapStatus(o.status),
  total: o.total,
  currency: "EGP",
  notes: o.address,
  paymentStatus: o.payment === "COD" ? "unpaid" : "paid",
  createdAt: o.createdAt,
  updatedAt: o.createdAt,
  conversationId: o.chatId,
  _items: o.items.map((it, j) => ({
    id: `${o.id}-i${j}`,
    orderId: o.id,
    nameSnapshot: it.name,
    priceSnapshot: it.price,
    qty: it.qty,
    subtotal: it.price * it.qty,
  })),
}));

export function demoOrdersList(params?: { status?: string }): { items: Order[] } {
  let items = demoOrdersStore.map(({ _items, customerName, ...rest }) => ({
    ...rest,
    customerId: customerName,
  }));
  if (params?.status) items = items.filter((o) => o.status === params.status);
  return { items };
}

export function demoOrderGet(id: string): OrderDetail {
  const o = demoOrdersStore.find((x) => x.id === id);
  if (!o) throw new Error("not found");
  const { _items, customerName, ...rest } = o;
  return { ...rest, customerId: customerName, items: _items };
}

export function demoOrderApprove(id: string): Order {
  const o = demoOrdersStore.find((x) => x.id === id);
  if (o) o.status = "confirmed";
  return demoOrderGet(id) as unknown as Order;
}

export function demoOrderReject(id: string): Order {
  const o = demoOrdersStore.find((x) => x.id === id);
  if (o) o.status = "rejected";
  return demoOrderGet(id) as unknown as Order;
}

export function demoOrderEdit(id: string, items: { nameSnapshot?: string; name?: string; qty: number; priceSnapshot?: number; price?: number }[]): Order {
  const o = demoOrdersStore.find((x) => x.id === id);
  if (o) {
    o._items = items.map((it, j) => ({
      id: `${id}-i${j}`,
      orderId: id,
      nameSnapshot: it.nameSnapshot ?? it.name ?? "Item",
      priceSnapshot: it.priceSnapshot ?? it.price ?? 0,
      qty: it.qty,
      subtotal: (it.priceSnapshot ?? it.price ?? 0) * it.qty,
    }));
    o.total = o._items.reduce((s, i) => s + i.subtotal, 0);
  }
  return demoOrderGet(id) as unknown as Order;
}

// --- analytics ---
export const demoAnalytics: AnalyticsOverview = {
  conversationsToday: chats.length + 7,
  ordersPending: demoOrdersStore.filter((o) => o.status === "draft_pending_owner" || o.status === "confirmed").length,
  revenueThisWeek: demoOrdersStore
    .filter((o) => o.status !== "cancelled" && o.status !== "rejected")
    .reduce((s, o) => s + o.total, 0),
  avgFirstResponseSec: 42,
};

// --- whatsapp health ---
export const demoWhatsappHealth: WhatsappHealth = {
  connected: true,
  state: "open",
  lastSeen: new Date().toISOString(),
};

// --- customers ---
export const demoCustomers: { items: Customer[]; nextCursor: string | null } = {
  items: clients.map((c, i) => ({
    id: `cl${i + 1}`,
    phone: c.phone,
    name: c.name,
  })),
  nextCursor: null,
};

// --- automations ---
export const demoAutomations: Automations = {
  autoReplyEnabled: true,
  businessHours: { start: "09:00", end: "21:00", tz: "Africa/Cairo" },
  urgentKeywords: ["complaint", "late", "wrong"],
  awayMessage: "We are closed. We will reply during business hours.",
  personaPrompt: "Friendly Arabic-speaking restaurant agent. Quote prices only from the catalog.",
  updatedAt: new Date().toISOString(),
};

export const demoOrdersLast7 = ordersLast7;