"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useOrders } from "@/hooks/useOrders";
import { useConversations } from "@/hooks/useConversations";
import { useAnalytics } from "@/hooks/useAnalytics";
import { KpiCard } from "@/components/ui/KpiCard";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/LoadingSkeleton";
import { demoOrdersLast7 } from "@/lib/demo";
import { MessageSquare, Receipt, Truck, Wallet } from "lucide-react";

const statusColor: Record<string, string> = {
  draft_pending_owner: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  ready: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  delivered: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
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

  const newToday = orders.filter((o) => o.status === "draft_pending_owner" || o.status === "confirmed").length;
  const awaiting = orders.filter((o) => o.status === "draft_pending_owner").length;
  const outForDelivery = orders.filter((o) => o.status === "ready").length;
  const revenueToday = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "rejected")
    .reduce((s, o) => s + o.total, 0);

  const needsYou = [
    { label: T("unclearOrders"), value: orders.filter((o) => o.status === "draft_pending_owner").length, color: "text-amber-600 dark:text-amber-400" },
    { label: T("complaints"), value: convs.filter((c) => c.status === "human").length, color: "text-red-600 dark:text-red-400" },
    { label: T("askedForHuman"), value: convs.filter((c) => c.status === "human").length, color: "text-purple-600 dark:text-purple-400" },
  ];
  const handled = [
    { label: T("ordersCaptured"), value: orders.length },
    { label: T("priceQuestions"), value: convs.filter((c) => c.lastMessagePreview?.toLowerCase().includes("how much")).length },
    { label: T("confirmationsSent"), value: orders.filter((o) => o.status !== "draft_pending_owner").length },
  ];

  if (orders.length === 0 && convs.length === 0) {
    return <EmptyState title="No data yet" description="Connect WhatsApp and start receiving orders." />;
  }

  const maxBar = Math.max(...demoOrdersLast7, 1);

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{T("overview")}</h1>
          <p className="text-sm text-ink-muted">
            {T("autoReplyOn")} · {T("businessHours")} 09:00–21:00 Cairo
          </p>
        </div>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={T("newOrdersToday")} value={a?.conversationsToday ?? newToday} delta="vs yesterday" icon={<MessageSquare size={16} />} />
        <KpiCard label={T("awaitingConfirm")} value={a?.ordersPending ?? awaiting} delta="needs you" icon={<Receipt size={16} />} />
        <KpiCard label={T("outForDelivery")} value={outForDelivery} delta="on the way" icon={<Truck size={16} />} />
        <KpiCard label={T("revenueToday")} value={`EGP ${(a?.revenueThisWeek ?? revenueToday).toLocaleString()}`} delta="this week" icon={<Wallet size={16} />} />
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm lg:col-span-2">
          <h2 className="text-sm font-semibold text-ink">{T("ordersLast7")}</h2>
          <div className="mt-4 flex h-40 items-end gap-2">
            {demoOrdersLast7.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-accent/80 transition-all"
                  style={{ height: `${Math.max(4, (v / maxBar) * 100)}%` }}
                  title={`${v} orders`}
                />
                <span className="text-[10px] text-ink-subtle">{["S", "M", "T", "W", "T", "F", "S"][i]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-danger">{T("needsYou")}</h2>
            <ul className="mt-3 space-y-2">
              {needsYou.map((n) => (
                <li key={n.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{n.label}</span>
                  <span className={`font-semibold tabular-nums ${n.color}`}>{n.value}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-accent">{T("handledByAgent")}</h2>
            <ul className="mt-3 space-y-2">
              {handled.map((n) => (
                <li key={n.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink-muted">{n.label}</span>
                  <span className="font-semibold tabular-nums text-accent">{n.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-ink">{T("orders")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-ink-muted">
              <tr>
                <th className="py-2 text-start">ID</th>
                <th className="py-2 text-start">{T("customer")}</th>
                <th className="py-2 text-start">{T("total")}</th>
                <th className="py-2 text-start">{T("status")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 6).map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="py-2 font-mono text-xs text-ink-subtle">{o.id}</td>
                  <td className="py-2 text-ink">{o.customerId}</td>
                  <td className="py-2 tabular-nums text-ink">{o.currency} {o.total}</td>
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