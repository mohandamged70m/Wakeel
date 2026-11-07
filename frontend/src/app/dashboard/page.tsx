"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { orders, ordersLast7, chats } from "@/lib/mock";

const statusColor: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  out: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  delivered: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function OverviewPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);

  const newToday = orders.filter((o) => o.status === "new").length;
  const awaiting = orders.filter((o) => o.status === "confirmed" || o.status === "new").length;
  const outForDelivery = orders.filter((o) => o.status === "out").length;
  const revenueToday = orders.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.total, 0);

  const needsYou = [
    { label: T("unclearOrders"), value: 2, color: "text-amber-600 dark:text-amber-400" },
    { label: T("complaints"), value: chats.filter((c) => c.tags.includes("complaint")).length, color: "text-red-600 dark:text-red-400" },
    { label: T("askedForHuman"), value: chats.filter((c) => c.tags.includes("askedForHuman")).length, color: "text-purple-600 dark:text-purple-400" },
  ];
  const handled = [
    { label: T("ordersCaptured"), value: 6 },
    { label: T("priceQuestions"), value: 14 },
    { label: T("confirmationsSent"), value: 6 },
  ];

  const max = Math.max(...ordersLast7);

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{T("overview")}</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {T("autoReplyOn")} · {T("businessHours")} 09:00–21:00 Cairo
          </p>
        </div>
        <button className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800">
          {T("toggleAutoReply")}
        </button>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: T("newOrdersToday"), value: newToday, delta: "+3", color: "text-blue-600 dark:text-blue-400" },
          { label: T("awaitingConfirm"), value: awaiting, delta: "needs you", color: "text-amber-600 dark:text-amber-400" },
          { label: T("outForDelivery"), value: outForDelivery, delta: "on the way", color: "text-purple-600 dark:text-purple-400" },
          { label: T("revenueToday"), value: `EGP ${revenueToday.toLocaleString()}`, delta: "+8%", color: "text-emerald-600 dark:text-emerald-400" },
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
            {ordersLast7.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-md bg-teal-500/80 transition hover:bg-teal-500"
                  style={{ height: `${(v / max) * 100}%` }}
                />
                <span className="text-[10px] text-zinc-400">{["S","M","T","W","T","F","S"][i]}</span>
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
                  <td className="py-2">{o.customer}</td>
                  <td className="py-2 text-zinc-500 dark:text-zinc-400">{o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</td>
                  <td className="py-2 tabular-nums">EGP {o.total}</td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[o.status]}`}>{T(o.status as any)}</span>
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