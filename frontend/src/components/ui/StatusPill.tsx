const colorMap: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  out: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  delivered: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] || "bg-zinc-100 text-zinc-600"}`}>
      {label || status}
    </span>
  );
}