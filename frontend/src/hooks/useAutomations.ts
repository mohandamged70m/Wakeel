"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAutomations() {
  return useQuery({ queryKey: ["automations"], queryFn: () => api.automations.get() });
}