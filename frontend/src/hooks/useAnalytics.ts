"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAnalytics(range?: string) {
  return useQuery({ queryKey: ["analytics", range], queryFn: () => api.analytics.overview(range) });
}

export function useWhatsappStatus() {
  return useQuery({ queryKey: ["whatsapp", "health"], queryFn: () => api.whatsapp.health() });
}