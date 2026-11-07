"use client";
import { MessageCircle } from "lucide-react";

export function ConversationRow({
  customer,
  phone,
  preview,
  time,
  unread,
  selected,
  onClick,
}: {
  customer: string;
  phone: string;
  preview: string;
  time: string;
  unread?: boolean;
  selected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 border-b border-border p-3 text-start transition ${
        selected ? "bg-accent-soft" : "hover:bg-bg-subtle"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
        <MessageCircle size={16} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-medium text-ink">{customer}</span>
          <span className="shrink-0 text-xs text-ink-subtle">{time}</span>
        </div>
        <p className="truncate text-xs text-ink-muted">{phone}</p>
        <p className="mt-1 truncate text-xs text-ink-muted">{preview}</p>
      </div>
      {unread ? <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" aria-label="unread" /> : null}
    </button>
  );
}