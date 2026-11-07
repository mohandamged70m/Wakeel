"use client";
import { useEffect } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-5 shadow-lg">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {description ? <p className="mt-2 text-sm text-ink-muted">{description}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink hover:bg-bg-subtle">{cancelLabel}</button>
          <button onClick={onConfirm} className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink hover:bg-accent-hover">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}