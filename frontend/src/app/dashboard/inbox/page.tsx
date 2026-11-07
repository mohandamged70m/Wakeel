"use client";
import { useState } from "react";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { chats } from "@/lib/mock";
import { Mic } from "lucide-react";

const tagColor: Record<string, string> = {
  newOrder: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  question: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  complaint: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  awaitingPayment: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
};

export default function InboxPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const [selected, setSelected] = useState(chats[0]);
  const tagLabel: Record<string, string> = {
    newOrder: "New order",
    question: "Question",
    complaint: "Complaint",
    awaitingPayment: "Waiting for payment",
    askedForHuman: "Asked for a person",
  };

  return (
    <div className="flex h-screen">
      <div className="w-80 shrink-0 border-e border-border bg-surface">
        <div className="border-b border-border p-4">
          <h1 className="text-lg font-semibold text-ink">{T("inbox")}</h1>
          <p className="text-xs text-ink-muted">{chats.length} {T("conversations")}</p>
        </div>
        <ul className="overflow-y-auto">
          {chats.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(c)}
                className={`w-full border-b border-border p-4 text-start transition ${
                  selected.id === c.id ? "bg-accent-soft" : "hover:bg-bg-subtle"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{c.customer}</span>
                  <span className="text-xs text-ink-subtle">{c.time}</span>
                </div>
                <p className="mt-1 truncate text-xs text-ink-muted">
                  {c.isVoice ? <Mic size={12} className="inline me-1" aria-hidden="true" /> : null}
                  {c.lastMessage}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {c.tags.map((tag) => (
                    <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColor[tag] || "bg-zinc-100 text-zinc-600"}`}>
                      {tagLabel[tag] || tag}
                    </span>
                  ))}
                  {c.orderId && (
                    <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-medium text-accent">
                      {T("orderDetected")}: {c.orderId}
                    </span>
                  )}
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
              <h2 className="font-semibold text-ink">{selected.customer}</h2>
              <p className="text-xs text-ink-muted">{selected.phone}</p>
            </div>
            <button className="rounded-lg bg-danger px-3 py-1.5 text-xs font-medium text-white hover:opacity-90">
              {T("takeOverBtn")}
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          <div className="ms-auto max-w-[70%] rounded-2xl rounded-te-sm bg-accent px-4 py-2 text-sm text-accent-ink">
            {selected.lastMessage}
            {selected.isVoice && (
              <p className="mt-1 text-[10px] opacity-80">
                <Mic size={10} className="inline me-1" aria-hidden="true" />
                {T("voiceNote")} to text
              </p>
            )}
          </div>
          <div className="max-w-[70%] rounded-2xl rounded-ts-sm bg-bg-subtle px-4 py-2 text-sm text-ink">
            Agent: got it, creating your order...
          </div>
        </div>
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-bg-subtle p-3">
            <p className="text-xs font-semibold text-ink-muted">{T("agentReason")}</p>
            <p className="mt-1 text-xs text-ink">{selected.agentReason}</p>
          </div>
        </div>
      </div>
    </div>
  );
}