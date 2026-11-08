import { createClient as createSupabaseClient } from "@/lib/supabase/client";
import type {
  AnalyticsOverview,
  Automations,
  Conversation,
  Customer,
  MenuCategory,
  MenuItem,
  Message,
  Order,
  OrderDetail,
  WhatsappHealth,
} from "@/lib/types";
import * as demo from "@/lib/demo";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function authHeaders(): Promise<Record<string, string>> {
  try {
    const supabase = createSupabaseClient();
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {
    // Supabase not configured; proceed without token (dev).
  }
  return {};
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = { "Content-Type": "application/json", ...(await authHeaders()), ...(init.headers || {}) };
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  return (await res.json()) as T;
}

// Graceful demo fallback: when the backend is unreachable (local demo), use seed data.
async function withFallback<T>(real: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await real();
  } catch {
    return fallback();
  }
}

export const api = {
  conversations: {
    list: (params?: { status?: string; q?: string }) =>
      withFallback(
        () => {
          const qs = new URLSearchParams();
          if (params?.status) qs.set("status", params.status);
          if (params?.q) qs.set("q", params.q);
          const suffix = qs.toString() ? `?${qs.toString()}` : "";
          return request<{ items: Conversation[]; nextCursor: string | null }>(`/conversations${suffix}`);
        },
        () => ({ items: demo.demoConversations, nextCursor: null }),
      ),
    messages: (id: string) =>
      withFallback(
        () => request<{ items: Message[] }>(`/conversations/${id}/messages`),
        () => demo.demoMessages(id),
      ),
    takeover: (id: string) =>
      withFallback(
        () => request<{ status: string }>(`/conversations/${id}/takeover`, { method: "POST" }),
        () => ({ status: "human" }),
      ),
    returnToBot: (id: string) =>
      withFallback(
        () => request<{ status: string }>(`/conversations/${id}/return-to-bot`, { method: "POST" }),
        () => ({ status: "bot" }),
      ),
  },
  orders: {
    list: (params?: { status?: string; cursor?: string }) =>
      withFallback(
        () => {
          const qs = new URLSearchParams();
          if (params?.status) qs.set("status", params.status);
          if (params?.cursor) qs.set("cursor", params.cursor);
          const suffix = qs.toString() ? `?${qs.toString()}` : "";
          return request<{ items: Order[] }>(`/orders${suffix}`);
        },
        () => demo.demoOrdersList(params),
      ),
    get: (id: string) =>
      withFallback(
        () => request<Order & { items: any[] }>(`/orders/${id}`),
        () => demo.demoOrderGet(id) as any,
      ),
    approve: (id: string) =>
      withFallback(
        () => request<Order>(`/orders/${id}/approve`, { method: "POST" }),
        () => demo.demoOrderApprove(id),
      ),
    reject: (id: string) =>
      withFallback(
        () => request<Order>(`/orders/${id}/reject`, { method: "POST" }),
        () => demo.demoOrderReject(id),
      ),
    edit: (id: string, items: unknown[]) =>
      withFallback(
        () => request<Order>(`/orders/${id}/edit`, { method: "POST", body: JSON.stringify({ items }) }),
        () => demo.demoOrderEdit(id, items as any),
      ),
  },
  menu: {
    categories: {
      list: () =>
        withFallback(
          () => request<{ items: MenuCategory[] }>(`/menu/categories`),
          () => ({ items: [] }),
        ),
      create: (body: Partial<MenuCategory>) =>
        withFallback(
          () => request<MenuCategory>(`/menu/categories`, { method: "POST", body: JSON.stringify(body) }),
          () => ({ id: "demo", organizationId: "", nameEn: body.nameEn || "", sortOrder: 0, ...body } as MenuCategory),
        ),
    },
    items: {
      list: (categoryId?: string) =>
        withFallback(
          () => {
            const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
            return request<{ items: MenuItem[] }>(`/menu/items${qs}`);
          },
          () => ({ items: [] }),
        ),
      create: (body: Partial<MenuItem>) =>
        withFallback(
          () => request<MenuItem>(`/menu/items`, { method: "POST", body: JSON.stringify(body) }),
          () => ({ id: "demo", nameEn: body.nameEn || "", price: body.price || 0, currency: "EGP", available: true, ...body } as MenuItem),
        ),
      update: (id: string, body: Partial<MenuItem>) =>
        withFallback(
          () => request<MenuItem>(`/menu/items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
          () => ({ id, nameEn: body.nameEn || "", price: body.price || 0, currency: "EGP", available: true, ...body } as MenuItem),
        ),
      delete: (id: string) =>
        withFallback(
          () => request<{ deleted: boolean }>(`/menu/items/${id}`, { method: "DELETE" }),
          () => ({ deleted: true }),
        ),
    },
  },
  customers: {
    list: () => withFallback(() => request<{ items: Customer[]; nextCursor: string | null }>(`/customers`), () => demo.demoCustomers),
    get: (id: string) =>
      withFallback(
        () => request<{ customer: Customer | null; orders: Order[]; conversations: Conversation[] }>(`/customers/${id}`),
        () => ({ customer: null, orders: [], conversations: [] }),
      ),
  },
  automations: {
    get: () => withFallback(() => request<Automations>(`/automations`), () => demo.demoAutomations),
    update: (body: Partial<Automations>) =>
      withFallback(
        () => request<Automations>(`/automations`, { method: "PUT", body: JSON.stringify(body) }),
        () => ({ ...demo.demoAutomations, ...body }),
      ),
  },
  analytics: {
    overview: (range?: string) =>
      withFallback(
        () => {
          const qs = range ? `?range=${encodeURIComponent(range)}` : "";
          return request<AnalyticsOverview>(`/analytics/overview${qs}`);
        },
        () => demo.demoAnalytics,
      ),
  },
  whatsapp: {
    health: () => withFallback(() => request<WhatsappHealth>(`/health/whatsapp`), () => demo.demoWhatsappHealth),
  },
};