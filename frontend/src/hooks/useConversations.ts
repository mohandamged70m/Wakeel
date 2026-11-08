"use client";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useConversations(params?: { status?: string; q?: string }) {
  return useQuery({
    queryKey: ["conversations", params],
    queryFn: () => api.conversations.list(params),
  });
}

export function useMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => (conversationId ? api.conversations.messages(conversationId) : Promise.resolve({ items: [] })),
    enabled: !!conversationId,
  });
}