import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../../supabase/supabase.service.js";
import { MemoryStore } from "../memory-store.js";
import type { MenuCategory, MenuItem } from "../types.js";

@Injectable()
export class MenuRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly memory: MemoryStore,
  ) {}

  async listCategories(orgId: string): Promise<MenuCategory[]> {
    if (this.supabase.client) {
      const { data } = await this.supabase.client
        .from("menu_categories")
        .select()
        .eq("organization_id", orgId)
        .order("sort_order", { ascending: true });
      return ((data ?? []) as Record<string, unknown>[]).map((r) => this.mapCat(r));
    }
    return [...this.memory.menuCategories.values()].filter((c) => c.organizationId === orgId);
  }

  async createCategory(orgId: string, nameEn: string, nameAr?: string | null, sortOrder = 0): Promise<MenuCategory> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("menu_categories")
        .insert({ organization_id: orgId, name_en: nameEn, name_ar: nameAr ?? null, sort_order: sortOrder })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? "category insert failed");
      return this.mapCat(data as Record<string, unknown>);
    }
    const c: MenuCategory = {
      id: this.memory.id(),
      organizationId: orgId,
      nameAr: nameAr ?? null,
      nameEn,
      sortOrder,
    };
    this.memory.menuCategories.set(c.id, c);
    return c;
  }

  async listItems(orgId: string, categoryId?: string): Promise<MenuItem[]> {
    if (this.supabase.client) {
      let q = this.supabase.client.from("menu_items").select().eq("organization_id", orgId);
      if (categoryId) q = q.eq("category_id", categoryId);
      const { data } = await q.order("created_at", { ascending: true });
      return ((data ?? []) as Record<string, unknown>[]).map((r) => this.mapItem(r));
    }
    let items = [...this.memory.menuItems.values()].filter((i) => i.organizationId === orgId);
    if (categoryId) items = items.filter((i) => i.categoryId === categoryId);
    return items;
  }

  async createItem(orgId: string, input: Partial<MenuItem> & { nameEn: string; price: number; currency: string }): Promise<MenuItem> {
    if (this.supabase.client) {
      const { data, error } = await this.supabase.client
        .from("menu_items")
        .insert({
          organization_id: orgId,
          category_id: input.categoryId ?? null,
          name_ar: input.nameAr ?? null,
          name_en: input.nameEn,
          description_ar: input.descriptionAr ?? null,
          description_en: input.descriptionEn ?? null,
          price: input.price,
          currency: input.currency,
          image_url: input.imageUrl ?? null,
          available: input.available ?? true,
          sku: input.sku ?? null,
        })
        .select()
        .single();
      if (error || !data) throw new Error(error?.message ?? "item insert failed");
      return this.mapItem(data as Record<string, unknown>);
    }
    const item: MenuItem = {
      id: this.memory.id(),
      organizationId: orgId,
      categoryId: input.categoryId ?? null,
      nameAr: input.nameAr ?? null,
      nameEn: input.nameEn,
      descriptionAr: input.descriptionAr ?? null,
      descriptionEn: input.descriptionEn ?? null,
      price: input.price,
      currency: input.currency,
      imageUrl: input.imageUrl ?? null,
      available: input.available ?? true,
      sku: input.sku ?? null,
    };
    this.memory.menuItems.set(item.id, item);
    return item;
  }

  async updateItem(orgId: string, id: string, patch: Partial<MenuItem>): Promise<MenuItem | null> {
    if (this.supabase.client) {
      const update: Record<string, unknown> = {};
      if (patch.nameAr !== undefined) update.name_ar = patch.nameAr;
      if (patch.nameEn !== undefined) update.name_en = patch.nameEn;
      if (patch.descriptionAr !== undefined) update.description_ar = patch.descriptionAr;
      if (patch.descriptionEn !== undefined) update.description_en = patch.descriptionEn;
      if (patch.price !== undefined) update.price = patch.price;
      if (patch.currency !== undefined) update.currency = patch.currency;
      if (patch.imageUrl !== undefined) update.image_url = patch.imageUrl;
      if (patch.available !== undefined) update.available = patch.available;
      if (patch.sku !== undefined) update.sku = patch.sku;
      if (patch.categoryId !== undefined) update.category_id = patch.categoryId;
      update.updated_at = new Date().toISOString();
      const { data, error } = await this.supabase.client
        .from("menu_items")
        .update(update)
        .eq("organization_id", orgId)
        .eq("id", id)
        .select()
        .single();
      if (error || !data) return null;
      return this.mapItem(data as Record<string, unknown>);
    }
    const item = this.memory.menuItems.get(id);
    if (!item || item.organizationId !== orgId) return null;
    Object.assign(item, patch);
    return item;
  }

  async deleteItem(orgId: string, id: string): Promise<boolean> {
    if (this.supabase.client) {
      const { error } = await this.supabase.client
        .from("menu_items")
        .delete()
        .eq("organization_id", orgId)
        .eq("id", id);
      return !error;
    }
    const item = this.memory.menuItems.get(id);
    if (!item || item.organizationId !== orgId) return false;
    this.memory.menuItems.delete(id);
    return true;
  }

  async getItem(orgId: string, id: string): Promise<MenuItem | null> {
    if (this.supabase.client) {
      const { data } = await this.supabase.client
        .from("menu_items")
        .select()
        .eq("organization_id", orgId)
        .eq("id", id)
        .maybeSingle();
      return data ? this.mapItem(data as Record<string, unknown>) : null;
    }
    const item = this.memory.menuItems.get(id);
    return item && item.organizationId === orgId ? item : null;
  }

  private mapCat(r: Record<string, unknown>): MenuCategory {
    return {
      id: String(r.id),
      organizationId: String(r.organization_id),
      nameAr: (r.name_ar as string | null) ?? null,
      nameEn: String(r.name_en),
      sortOrder: Number(r.sort_order ?? 0),
    };
  }

  private mapItem(r: Record<string, unknown>): MenuItem {
    return {
      id: String(r.id),
      organizationId: String(r.organization_id),
      categoryId: (r.category_id as string | null) ?? null,
      nameAr: (r.name_ar as string | null) ?? null,
      nameEn: String(r.name_en),
      descriptionAr: (r.description_ar as string | null) ?? null,
      descriptionEn: (r.description_en as string | null) ?? null,
      price: Number(r.price),
      currency: String(r.currency),
      imageUrl: (r.image_url as string | null) ?? null,
      available: Boolean(r.available ?? true),
      sku: (r.sku as string | null) ?? null,
    };
  }
}
