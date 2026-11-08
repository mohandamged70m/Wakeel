"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useOrders } from "@/hooks/useOrders";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/LoadingSkeleton";

const statusColor: Record<string, string> = {
  draft_pending_owner: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  ready: "bg-accent-soft text-accent dark:bg-accent-soft dark:text-accent",
  delivered: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function OrdersPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const q = useOrders();

  if (q.isLoading) return <div className="p-6"><LoadingSkeleton lines={6} /></div>;
  if (q.isError) return <ErrorState message="Failed to load orders" />;
  const items = q.data?.items ?? [];
  if (items.length === 0) return <EmptyState title="No orders yet" description="Orders will appear here." />;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{T("orders")}</h1>
      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-stone-500 dark:text-stone-400">
            <tr>
              <th className="py-2 px-4 text-start">ID</th>
              <th className="py-2 px-4 text-start">{T("customer")}</th>
              <th className="py-2 px-4 text-start">{T("total")}</th>
              <th className="py-2 px-4 text-start">{T("status")}</th>
              <th className="py-2 px-4 text-start">{T("payment")}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-t border-stone-100 dark:border-stone-800">
                <td className="py-2 px-4 font-mono text-xs">{o.id}</td>
                <td className="py-2 px-4">{o.customerId}</td>
                <td className="py-2 px-4 tabular-nums">{o.currency} {o.total}</td>
                <td className="py-2 px-4">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[o.status] || ""}`}>{o.status}</span>
                </td>
                <td className="py-2 px-4">{o.paymentStatus ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


