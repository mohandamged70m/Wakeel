"use client";
import { useEffect, useState } from "react";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useConversations, useMessages } from "@/hooks/useConversations";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/LoadingSkeleton";
import { Mic, Send, UserCog, Bot, ArrowLeft } from "lucide-react";

export default function InboxPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const qc = useQueryClient();
  const convsQ = useConversations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showThread, setShowThread] = useState(false);
  const [draft, setDraft] = useState("");
  const [takingOver, setTakingOver] = useState(false);

  useEffect(() => {
    if (!selectedId && convsQ.data?.items?.length) {
      setSelectedId(convsQ.data.items[0].id);
    }
  }, [convsQ.data, selectedId]);

  if (convsQ.isLoading) return <div className="p-6"><LoadingSkeleton lines={6} /></div>;
  if (convsQ.isError) return <ErrorState message="Failed to load conversations" />;
  const convs = convsQ.data?.items ?? [];
  if (convs.length === 0) return <EmptyState title="No conversations yet" description="Incoming WhatsApp messages will appear here." />;

  const selected = convs.find((c) => c.id === selectedId) ?? convs[0];

  async function handleTakeover() {
    if (!selected) return;
    setTakingOver(true);
    try {
      await api.conversations.takeover(selected.id);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } finally {
      setTakingOver(false);
    }
  }

  async function handleReturn() {
    if (!selected) return;
    setTakingOver(true);
    try {
      await api.conversations.returnToBot(selected.id);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } finally {
      setTakingOver(false);
    }
  }

  function handleSend() {
    if (!draft.trim()) return;
    // Demo: append locally is not persisted; just clear. Real send goes through backend.
    setDraft("");
  }

  return (
    <div className="flex h-[calc(100vh-0px)] min-h-0 flex-col md:flex-row">
      {/* List */}
      <aside
        className={`w-full shrink-0 border-b border-border bg-surface md:w-80 md:border-b-0 md:border-e ${
          showThread ? "hidden md:flex md:flex-col" : "flex flex-col"
        }`}
      >
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-semibold text-ink">{T("inbox")}</h1>
          <p className="text-xs text-ink-muted">{convs.length} {T("conversations")}</p>
        </div>
        <ul className="flex-1 overflow-y-auto">
          {convs.map((c) => {
            const name = c.customer?.name ?? c.customer?.phone ?? c.customerId;
            return (
              <li key={c.id}>
                <button
                  onClick={() => {
                    setSelectedId(c.id);
                    setShowThread(true);
                  }}
                  className={`flex w-full items-start gap-3 border-b border-border p-3 text-start transition ${
                    selected.id === c.id ? "bg-accent-soft" : "hover:bg-bg-subtle"
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                    <Bot size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium text-ink">{name}</span>
                      <span className="shrink-0 text-xs text-ink-subtle">
                        {c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                      </span>
                    </div>
                    <p className="truncate text-xs text-ink-muted">{c.lastMessagePreview}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          c.status === "human" ? "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                        }`}
                      >
                        {c.status === "human" ? T("takeOver") : "bot"}
                      </span>
                      {c.unreadCount > 0 ? (
                        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-ink">
                          {c.unreadCount}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      {/* Thread */}
      <section
        className={`flex flex-1 flex-col bg-bg ${
          showThread ? "flex" : "hidden md:flex"
        }`}
      >
        <header className="flex items-center justify-between border-b border-border bg-surface p-4">
          <div className="flex items-center gap-3">
            <button
              className="rounded-md p-1 text-ink-muted hover:bg-bg-subtle md:hidden"
              onClick={() => setShowThread(false)}
              aria-label="Back"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2 className="font-semibold text-ink">{selected.customer?.name ?? selected.customer?.phone ?? selected.customerId}</h2>
              <p className="text-xs text-ink-muted">{selected.customer?.phone ?? ""}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selected.status === "human" ? (
              <button
                onClick={handleReturn}
                disabled={takingOver}
                className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg-subtle disabled:opacity-50"
              >
                <Bot size={12} className="me-1 inline" /> Return to bot
              </button>
            ) : (
              <button
                onClick={handleTakeover}
                disabled={takingOver}
                className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
              >
                <UserCog size={12} className="me-1 inline" /> {T("takeOverBtn")}
              </button>
            )}
          </div>
        </header>

        <MessagesPane conversationId={selected.id} />

        {/* Agent reason */}
        <div className="border-t border-border bg-surface p-3">
          <p className="text-xs font-semibold text-ink-muted">{T("agentReason")}</p>
          <p className="mt-1 text-xs text-ink">
            {selected.id === "c1"
              ? "Matched menu items 'Chicken Shawarma' x2 and 'Hummus' x1 from catalog; created draft order ORD-1042 awaiting owner confirm."
              : selected.id === "c2"
                ? "Transcribed voice note → 3x Falafel Wrap; address parsed as Maadi; payment method requested."
                : selected.id === "c3"
                  ? "Quoted price 180 EGP from product catalog (no AI guess)."
                  : selected.id === "c4"
                    ? "Complaint detected → escalated to owner, no auto-reply sent."
                    : "Human handoff requested → owner notified, agent paused on this chat."}
          </p>
        </div>

        <Composer value={draft} onChange={setDraft} onSend={handleSend} />
      </section>
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
      {items.map((m) => {
        const isOut = m.direction === "out";
        return (
          <div
            key={m.id}
            className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
              isOut
                ? "ms-auto bg-accent text-accent-ink rounded-te-sm"
                : "bg-bg-subtle text-ink rounded-ts-sm"
            }`}
          >
            {m.type === "audio" ? (
              <div className="flex items-start gap-2">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/10">
                  <Mic size={14} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-semibold opacity-80">Voice note · transcript</p>
                  <p className="mt-0.5">“{m.content}”</p>
                </div>
              </div>
            ) : (
              <p className="whitespace-pre-wrap">{m.content}</p>
            )}
            <p className={`mt-1 text-[10px] ${isOut ? "text-accent-ink/70" : "text-ink-subtle"}`}>
              {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              {m.senderType ? ` · ${m.senderType}` : ""}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Composer({ value, onChange, onSend }: { value: string; onChange: (v: string) => void; onSend: () => void }) {
  return (
    <form
      className="flex items-center gap-2 border-t border-border bg-surface p-3"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a message…"
        className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Message"
      />
      <button type="submit" className="rounded-lg bg-accent p-2 text-accent-ink hover:bg-accent-hover" aria-label="Send">
        <Send size={16} />
      </button>
    </form>
  );
}