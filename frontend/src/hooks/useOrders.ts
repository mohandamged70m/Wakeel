"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useOrders(params?: { status?: string; cursor?: string }) {
  return useQuery({
    queryKey: ["orders", params],
    queryFn: () => api.orders.list(params),
  });
}

export function useOrder(id: string | null) {
  return useQuery({
    queryKey: ["order", id],
    queryFn: () => (id ? api.orders.get(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}