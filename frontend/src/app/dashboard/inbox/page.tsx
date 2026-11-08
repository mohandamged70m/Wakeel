"use client";
import { useState } from "react";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useConversations } from "@/hooks/useConversations";
import { useMessages } from "@/hooks/useConversations";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/LoadingSkeleton";
import { Mic } from "lucide-react";

export default function InboxPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const convsQ = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (convsQ.isLoading) return <div className="p-6"><LoadingSkeleton lines={6} /></div>;
  if (convsQ.isError) return <ErrorState message="Failed to load conversations" />;
  const convs = convsQ.data?.items ?? [];
  if (convs.length === 0) return <EmptyState title="No conversations yet" description="Incoming WhatsApp messages will appear here." />;

  const selected = convs.find((c) => c.id === selectedId) ?? convs[0];
  if (selectedId === null && convs.length) setSelectedId(convs[0].id);

  return (
    <div className="flex h-screen">
      <div className="w-80 shrink-0 border-e border-border bg-surface">
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-semibold text-ink">{T("inbox")}</h1>
          <p className="text-xs text-ink-muted">{convs.length} {T("conversations")}</p>
        </div>
        <ul className="overflow-y-auto">
          {convs.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelectedId(c.id)}
                className={`w-full border-b border-border p-4 text-start transition ${
                  selected.id === c.id ? "bg-accent-soft" : "hover:bg-bg-subtle"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{c.customer?.name ?? c.customer?.phone ?? c.customerId}</span>
                  <span className="text-xs text-ink-subtle">{c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString() : ""}</span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-muted">{c.lastMessagePreview}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.status === "human" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                    {c.status}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-1 flex-col bg-bg">
        <div className="border-b border-border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-ink">{selected.customer?.name ?? selected.customer?.phone ?? selected.customerId}</h2>
              <p className="text-xs text-ink-muted">{selected.customer?.phone ?? ""}</p>
            </div>
            <button className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
              {T("takeOverBtn")}
            </button>
          </div>
        </div>
        <MessagesPane conversationId={selected.id} />
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-bg-subtle p-3">
            <p className="text-xs font-semibold text-ink-muted">{T("agentReason")}</p>
            <p className="mt-1 text-xs text-ink">—</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessagesPane({ conversationId }: { conversationId: string }) {
  const q = useMessages(conversationId);
  if (q.isLoading) return <div className="flex-1 p-4"><LoadingSkeleton lines={4} /></div>;
  if (q.isError) return <div className="flex-1 p-4"><ErrorState message="Failed to load messages" /></div>;
  const items = q.data?.items ?? [];
  return (
    <div className="flex-1 space-y-3 overflow-y-auto p-4">
      {items.map((m) => (
        <div key={m.id} className={m.direction === "out" ? "ms-auto max-w-[70%] rounded-2xl rounded-te-sm bg-accent px-4 py-2 text-sm text-accent-ink" : "max-w-[70%] rounded-2xl rounded-ts-sm bg-bg-subtle px-4 py-2 text-sm text-ink"}>
          {m.content}
          {m.type === "audio" && (
            <p className="mt-1 text-[10px] opacity-80">
              <Mic size={10} className="inline me-1" aria-hidden="true" />
              Voice note
            </p>
          )}
        </div>
      ))}
    </div>
  );
}


