"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useMenuCategories() {
  return useQuery({ queryKey: ["menu", "categories"], queryFn: () => api.menu.categories.list() });
}

export function useMenuItems(categoryId?: string) {
  return useQuery({ queryKey: ["menu", "items", categoryId], queryFn: () => api.menu.items.list(categoryId) });
}