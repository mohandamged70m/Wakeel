"use client";
import { useState } from "react";
import { Send } from "lucide-react";

export function Composer({ onSend }: { onSend?: (text: string) => void }) {
  const [text, setText] = useState("");
  return (
    <form
      className="flex items-center gap-2 border-t border-border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (text.trim()) {
          onSend?.(text.trim());
          setText("");
        }
      }}
    >
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type a message…"
        className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-subtle focus:outline-none focus:ring-2 focus:ring-accent"
        aria-label="Message"
      />
      <button type="submit" className="rounded-lg bg-accent p-2 text-accent-ink hover:bg-accent-hover" aria-label="Send">
        <Send size={16} />
      </button>
    </form>
  );
}