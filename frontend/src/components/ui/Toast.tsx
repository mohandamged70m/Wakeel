"use client";
import { useEffect } from "react";

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);
  return (
    <div className="fixed bottom-4 end-4 z-50 rounded-lg border border-border bg-surface px-4 py-2 text-sm text-ink shadow-lg" role="status">
      {message}
    </div>
  );
}