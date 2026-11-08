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
  if (!res.ok) {
    throw new Error(`API ${res.status} ${res.statusText} for ${path}`);
  }
  return (await res.json()) as T;
}

export const api = {
  conversations: {
    list: (params?: { status?: string; q?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.q) qs.set("q", params.q);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<{ items: Conversation[]; nextCursor: string | null }>(`/conversations${suffix}`);
    },
    messages: (id: string) => request<{ items: Message[] }>(`/conversations/${id}/messages`),
    takeover: (id: string) => request<{ status: string }>(`/conversations/${id}/takeover`, { method: "POST" }),
    returnToBot: (id: string) => request<{ status: string }>(`/conversations/${id}/return-to-bot`, { method: "POST" }),
  },
  orders: {
    list: (params?: { status?: string; cursor?: string }) => {
      const qs = new URLSearchParams();
      if (params?.status) qs.set("status", params.status);
      if (params?.cursor) qs.set("cursor", params.cursor);
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      return request<{ items: Order[] }>(`/orders${suffix}`);
    },
    get: (id: string) => request<OrderDetail>(`/orders/${id}`),
    approve: (id: string) => request<Order>(`/orders/${id}/approve`, { method: "POST" }),
    reject: (id: string) => request<Order>(`/orders/${id}/reject`, { method: "POST" }),
    edit: (id: string, items: unknown[]) =>
      request<Order>(`/orders/${id}/edit`, { method: "POST", body: JSON.stringify({ items }) }),
  },
  menu: {
    categories: {
      list: () => request<{ items: MenuCategory[] }>(`/menu/categories`),
      create: (body: Partial<MenuCategory>) =>
        request<MenuCategory>(`/menu/categories`, { method: "POST", body: JSON.stringify(body) }),
    },
    items: {
      list: (categoryId?: string) => {
        const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : "";
        return request<{ items: MenuItem[] }>(`/menu/items${qs}`);
      },
      create: (body: Partial<MenuItem>) =>
        request<MenuItem>(`/menu/items`, { method: "POST", body: JSON.stringify(body) }),
      update: (id: string, body: Partial<MenuItem>) =>
        request<MenuItem>(`/menu/items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
      delete: (id: string) => request<{ deleted: boolean }>(`/menu/items/${id}`, { method: "DELETE" }),
    },
  },
  customers: {
    list: () => request<{ items: Customer[]; nextCursor: string | null }>(`/customers`),
    get: (id: string) => request<{ customer: Customer | null; orders: Order[]; conversations: Conversation[] }>(`/customers/${id}`),
  },
  automations: {
    get: () => request<Automations>(`/automations`),
    update: (body: Partial<Automations>) =>
      request<Automations>(`/automations`, { method: "PUT", body: JSON.stringify(body) }),
  },
  analytics: {
    overview: (range?: string) => {
      const qs = range ? `?range=${encodeURIComponent(range)}` : "";
      return request<AnalyticsOverview>(`/analytics/overview${qs}`);
    },
  },
  whatsapp: {
    health: () => request<WhatsappHealth>(`/health/whatsapp`),
  },
};