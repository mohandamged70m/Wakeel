"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useCustomers() {
  return useQuery({ queryKey: ["customers"], queryFn: () => api.customers.list() });
}

export function useCustomer(id: string | null) {
  return useQuery({
    queryKey: ["customer", id],
    queryFn: () => (id ? api.customers.get(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}