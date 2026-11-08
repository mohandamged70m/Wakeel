export type Organization = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  locale: string;
};

export type User = {
  id: string;
  organizationId: string;
  role: "owner" | "staff";
  displayName: string | null;
  phone: string | null;
};

export type WhatsAppAccount = {
  id: string;
  organizationId: string;
  provider: "evolution" | "meta";
  instanceName: string | null;
  phoneNumberId: string | null;
  status: "pending" | "connected" | "disconnected";
};

export type Customer = {
  id: string;
  organizationId: string;
  phone: string;
  name: string | null;
  language: string;
  tags: string[];
  notes: string | null;
  createdAt: string;
};

export type Conversation = {
  id: string;
  organizationId: string;
  customerId: string;
  status: "bot" | "human" | "closed";
  assignedUserId: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
};

export type Message = {
  id: string;
  organizationId: string;
  conversationId: string;
  whatsappMessageId: string | null;
  direction: "in" | "out";
  senderType: "customer" | "bot" | "agent" | "owner";
  type: string;
  content: string | null;
  mediaUrl: string | null;
  status: string;
  createdAt: string;
};

export type MenuCategory = {
  id: string;
  organizationId: string;
  nameAr: string | null;
  nameEn: string;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  organizationId: string;
  categoryId: string | null;
  nameAr: string | null;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  available: boolean;
  sku: string | null;
};

export type Order = {
  id: string;
  organizationId: string;
  customerId: string;
  conversationId: string | null;
  status: "draft_pending_owner" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled" | "rejected";
  total: number;
  currency: string;
  notes: string | null;
  paymentStatus: "unpaid" | "paid" | "refunded";
  paymentLink: string | null;
  createdAt: string;
  updatedAt: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId: string | null;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
  subtotal: number;
};

export type Automations = {
  organizationId: string;
  autoReplyEnabled: boolean;
  businessHours: unknown;
  urgentKeywords: string[];
  awayMessage: string | null;
  personaPrompt: string | null;
  updatedAt: string | null;
};

export type AnalyticsOverview = {
  conversationsToday: number;
  ordersPending: number;
  revenueThisWeek: number;
  avgFirstResponseSec: number;
};

export type Escalation = {
  id: string;
  organizationId: string;
  conversationId: string | null;
  customerId: string | null;
  reason: string;
  summary: string | null;
  status: "open" | "resolved";
  createdAt: string;
};
