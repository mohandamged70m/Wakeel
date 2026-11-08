"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useOrders } from "@/hooks/useOrders";
import { useConversations } from "@/hooks/useConversations";
import { useAnalytics } from "@/hooks/useAnalytics";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/LoadingSkeleton";

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  out: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  delivered: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
  draft_pending_owner: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  ready: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function OverviewPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);

  const ordersQ = useOrders();
  const convsQ = useConversations();
  const analyticsQ = useAnalytics();

  if (ordersQ.isLoading || convsQ.isLoading || analyticsQ.isLoading) {
    return (
      <div className="p-6">
        <LoadingSkeleton lines={2} />
        <LoadingSkeleton lines={6} />
      </div>
    );
  }
  if (ordersQ.isError || convsQ.isError || analyticsQ.isError) {
    return <ErrorState message="Failed to load overview" />;
  }

  const orders = ordersQ.data?.items ?? [];
  const convs = convsQ.data?.items ?? [];
  const a = analyticsQ.data;

  const newToday = orders.filter((o) => o.status === "draft_pending_owner" || o.status === "new" as never).length;
  const awaiting = orders.filter((o) => o.status === "draft_pending_owner" || o.status === "confirmed").length;
  const outForDelivery = orders.filter((o) => o.status === "ready").length;
  const revenueToday = orders.filter((o) => o.status !== "cancelled" && o.status !== "rejected").reduce((s, o) => s + o.total, 0);

  const needsYou = [
    { label: T("unclearOrders"), value: 0, color: "text-amber-600 dark:text-amber-400" },
    { label: T("complaints"), value: convs.filter((c) => c.status === "human").length, color: "text-red-600 dark:text-red-400" },
    { label: T("askedForHuman"), value: convs.filter((c) => c.status === "human").length, color: "text-purple-600 dark:text-purple-400" },
  ];
  const handled = [
    { label: T("ordersCaptured"), value: orders.length },
    { label: T("priceQuestions"), value: 0 },
    { label: T("confirmationsSent"), value: orders.filter((o) => o.status !== "draft_pending_owner").length },
  ];

  if (orders.length === 0 && convs.length === 0) {
    return <EmptyState title="No data yet" description="Connect WhatsApp and start receiving orders." />;
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{T("overview")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T("autoReplyOn")} · {T("businessHours")} 09:00–21:00 Cairo
          </p>
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: T("newOrdersToday"), value: a?.conversationsToday ?? newToday, delta: "", color: "text-blue-600 dark:text-blue-400" },
          { label: T("awaitingConfirm"), value: a?.ordersPending ?? awaiting, delta: "needs you", color: "text-amber-600 dark:text-amber-400" },
          { label: T("outForDelivery"), value: outForDelivery, delta: "on the way", color: "text-purple-600 dark:text-purple-400" },
          { label: T("revenueToday"), value: `EGP ${(a?.revenueThisWeek ?? revenueToday).toLocaleString()}`, delta: "", color: "text-emerald-600 dark:text-emerald-400" },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">{k.label}</p>
            <p className={`mt-2 text-2xl font-semibold tabular-nums ${k.color}`}>{k.value}</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{k.delta}</p>
          </div>
        ))}
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <h2 className="text-sm font-semibold">{T("ordersLast7")}</h2>
          <div className="mt-4 flex h-40 items-end gap-2">
            {[0, 0, 0, 0, 0, 0, 0].map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div className="w-full rounded-t-md bg-teal-500/80" style={{ height: `${Math.max(4, (v + 1) * 4)}%` }} />
                <span className="text-[10px] text-zinc-400">{["S", "M", "T", "W", "T", "F", "S"][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-red-600 dark:text-red-400">{T("needsYou")}</h2>
            <ul className="mt-3 space-y-2">
              {needsYou.map((n) => (
                <li key={n.label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-300">{n.label}</span>
                  <span className={`font-semibold tabular-nums ${n.color}`}>{n.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-sm font-semibold text-teal-600 dark:text-teal-400">{T("handledByAgent")}</h2>
            <ul className="mt-3 space-y-2">
              {handled.map((n) => (
                <li key={n.label} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-600 dark:text-zinc-300">{n.label}</span>
                  <span className="font-semibold tabular-nums text-teal-600 dark:text-teal-400">{n.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 text-sm font-semibold">{T("orders")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="py-2 text-start">ID</th>
                <th className="py-2 text-start">{T("customer")}</th>
                <th className="py-2 text-start">{T("items")}</th>
                <th className="py-2 text-start">{T("total")}</th>
                <th className="py-2 text-start">{T("status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o) => (
                <tr key={o.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="py-2 font-mono text-xs">{o.id}</td>
                  <td className="py-2">{o.customerId}</td>
                  <td className="py-2 text-zinc-500 dark:text-zinc-400">—</td>
                  <td className="py-2 tabular-nums">{o.currency} {o.total}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[o.status] || ""}`}>{o.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}


