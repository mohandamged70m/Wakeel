import type { ReactNode } from "react";

export function DataTable({
  headers,
  children,
  caption,
}: {
  headers: string[];
  children: ReactNode;
  caption?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
      <table className="w-full text-sm">
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <thead className="text-xs uppercase text-ink-muted">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-start">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}