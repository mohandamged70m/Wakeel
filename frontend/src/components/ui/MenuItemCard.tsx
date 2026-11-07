export function MenuItemCard({
  name,
  price,
  available = true,
}: {
  name: string;
  price: number;
  available?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-medium text-ink">{name}</p>
        <span className={`text-xs ${available ? "text-success" : "text-ink-subtle"}`}>{available ? "Available" : "Unavailable"}</span>
      </div>
      <p className="mt-2 text-lg font-semibold tabular-nums text-ink">EGP {price}</p>
    </div>
  );
}

export function MenuItemForm({ onSubmit }: { onSubmit?: (data: { name: string; price: number }) => void }) {
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        onSubmit?.({ name: String(fd.get("name") || ""), price: Number(fd.get("price") || 0) });
      }}
    >
      <input name="name" placeholder="Item name" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink" required />
      <input name="price" type="number" placeholder="Price" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink" required />
      <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-accent-ink hover:bg-accent-hover">Save</button>
    </form>
  );
}