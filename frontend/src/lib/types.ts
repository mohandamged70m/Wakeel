export type ConversationStatus = "bot" | "human" | "closed";

export type Conversation = {
  id: string;
  organizationId?: string;
  customerId: string;
  customer: { id: string; phone: string; name: string | null } | null;
  status: ConversationStatus;
  assignedUserId?: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  lastMessagePreview: string | null;
};

export type Message = {
  id: string;
  organizationId?: string;
  conversationId: string;
  whatsappMessageId?: string | null;
  direction: "in" | "out";
  senderType: "customer" | "bot" | "agent" | "owner";
  type: string;
  content: string | null;
  mediaUrl: string | null;
  status: string;
  createdAt: string;
};

export type Customer = {
  id: string;
  organizationId?: string;
  phone: string;
  name: string | null;
  language?: string;
  tags?: string[];
  notes?: string | null;
  createdAt?: string;
};

export type OrderStatus =
  | "draft_pending_owner"
  | "confirmed"
  | "preparing"
  | "ready"
  | "delivered"
  | "cancelled"
  | "rejected";

export type Order = {
  id: string;
  organizationId?: string;
  customerId: string;
  conversationId?: string | null;
  status: OrderStatus;
  total: number;
  currency: string;
  notes?: string | null;
  paymentStatus?: "unpaid" | "paid" | "refunded";
  paymentLink?: string | null;
  createdAt: string;
  updatedAt?: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  menuItemId?: string | null;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
  subtotal: number;
};

export type OrderDetail = Order & { items: OrderItem[] };

export type MenuCategory = {
  id: string;
  organizationId?: string;
  nameEn: string;
  nameAr?: string | null;
  sortOrder: number;
};

export type MenuItem = {
  id: string;
  organizationId?: string;
  categoryId?: string | null;
  nameEn: string;
  nameAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  price: number;
  currency: string;
  imageUrl?: string | null;
  available: boolean;
  sku?: string | null;
};

export type Automations = {
  organizationId?: string;
  autoReplyEnabled: boolean;
  businessHours: unknown;
  urgentKeywords: string[];
  awayMessage: string | null;
  personaPrompt: string | null;
  updatedAt?: string | null;
};

export type AnalyticsOverview = {
  conversationsToday: number;
  ordersPending: number;
  revenueThisWeek: number;
  avgFirstResponseSec: number;
};

export type WhatsappHealth = {
  connected: boolean;
  state: string;
  lastSeen: string | null;
};