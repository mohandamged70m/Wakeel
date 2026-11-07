import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";
import type { Order, OrderItem } from "../types.js";

@Injectable()
export class OrdersRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async create(orgId: string, customerId: string, conversationId: string | null, currency: string, items: { menuItemId?: string | null; nameSnapshot: string; priceSnapshot: number; qty: number }[], notes?: string | null): Promise<Order> {
    const total = items.reduce((s, i) => s + i.priceSnapshot * i.qty, 0);
    if (this.supabase.client) {
      const { data: order, error } = await this.supabase.client
        .from("orders")
        .insert({
          organization_id: orgId,
          customer_id: customerId,
          conversation_id: conversationId,
          status: "draft_pending_owner",
          total,
          currency,
          notes: notes ?? null,
        })
        .select()
        .single();
      if (error || !order) throw new Error(error?.message ?? "order insert failed");
      const o = order as Record<string, unknown>;
      const orderId = String(o.id);
      for (const i of items) {
        await this.supabase.client.from("order_items").insert({
          order_id: orderId,
          menu_item_id: i.menuItemId ?? null,
          name_snapshot: i.nameSnapshot,
          price_snapshot: i.priceSnapshot,
          qty: i.qty,
          subtotal: i.priceSnapshot * i.qty,
        });
      }
      return this.map(o);
    }

    const order: Order = {
      id: this.memory.id(),
      organizationId: orgId,
      customerId,
      conversationId,
      status: "draft_pending_owner",
      total,
      currency,
      notes: notes ?? null,
      paymentStatus: "unpaid",
      paymentLink: null,
      createdAt: this.memory.now(),
      updatedAt: this.memory.now(),
    };
    this.memory.orders.set(order.id, order);
    for (const i of items) {
      const oi: OrderItem = {
        id: this.memory.id(),
        orderId: order.id,
        menuItemId: i.menuItemId ?? null,
        nameSnapshot: i.nameSnapshot,
        priceSnapshot: i.priceSnapshot,
        qty: i.qty,
        subtotal: i.priceSnapshot * i.qty,
      };
      this.memory.orderItems.set(oi.id, oi);
    }
    return order;
  }

  async findById(orgId: string, id: string): Promise<Order | null> {
    if (this.supabase.client) {
      const { data } = await this.supabase.client
        .from("orders")
        .select()
        .eq("organization_id", orgId)
        .eq("id", id)
        .maybeSingle();
      return data ? this.map(data as Record<string, unknown>) : null;
    }
    const o = this.memory.orders.get(id);
    return o && o.organizationId === orgId ? o : null;
  }

  async list(orgId: string, status?: string): Promise<Order[]> {
    if (this.supabase.client) {
      let q = this.supabase.client.from("orders").select().eq("organization_id", orgId);
      if (status) q = q.eq("status", status);
      const { data } = await q.order("created_at", { ascending: false }).limit(100);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => this.map(r));
    }
    let items = [...this.memory.orders.values()].filter((o) => o.organizationId === orgId);
    if (status) items = items.filter((o) => o.status === status);
    return items;
  }

  async listItems(orderId: string): Promise<OrderItem[]> {
    if (this.supabase.client) {
      const { data } = await this.supabase.client
        .from("order_items")
        .select()
        .eq("order_id", orderId);
      return ((data ?? []) as Record<string, unknown>[]).map((r) => ({
        id: String(r.id),
        orderId: String(r.order_id),
        menuItemId: (r.menu_item_id as string | null) ?? null,
        nameSnapshot: String(r.name_snapshot),
        priceSnapshot: Number(r.price_snapshot),
        qty: Number(r.qty),
        subtotal: Number(r.subtotal),
      }));
    }
    return [...this.memory.orderItems.values()].filter((i) => i.orderId === orderId);
  }

  async updateStatus(orgId: string, id: string, status: Order["status"]): Promise<Order | null> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("orders")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("organization_id", orgId)
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return null;
      return this.map(data as Record<string, unknown>);
    }
    const o = this.memory.orders.get(id);
    if (!o || o.organizationId !== orgId) return null;
    o.status = status;
    o.updatedAt = this.memory.now();
    return o;
  }

  private map(r: Record<string, unknown>): Order {
    return {
      id: String(r.id),
      organizationId: String(r.organization_id),
      customerId: String(r.customer_id),
      conversationId: (r.conversation_id as string | null) ?? null,
      status: r.status as Order["status"],
      total: Number(r.total),
      currency: String(r.currency),
      notes: (r.notes as string | null) ?? null,
      paymentStatus: (r.payment_status as Order["paymentStatus"]) ?? "unpaid",
      paymentLink: (r.payment_link as string | null) ?? null,
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }
}
