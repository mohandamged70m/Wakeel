import { StatusPill } from "./StatusPill";

export function OrderCard({
  id,
  customer,
  total,
  status,
  label,
}: {
  id: string;
  customer: string;
  total: number;
  status: string;
  label?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-ink-subtle">{id}</span>
        <StatusPill status={status} label={label} />
      </div>
      <p className="mt-1 font-medium text-ink">{customer}</p>
      <p className="mt-1 text-sm font-semibold tabular-nums text-ink">EGP {total}</p>
    </div>
  );
}