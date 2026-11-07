import type { ReactNode } from "react";

export function KpiCard({
  label,
  value,
  delta,
  icon,
}: {
  label: string;
  value: ReactNode;
  delta?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        {icon ? <span className="text-ink-subtle">{icon}</span> : null}
      </div>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-ink">{value}</p>
      {delta ? <p className="mt-1 text-xs text-ink-muted">{delta}</p> : null}
    </div>
  );
}