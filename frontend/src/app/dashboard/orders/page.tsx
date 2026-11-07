"use client";
import { useState } from "react";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { orders as initialOrders, Order, OrderStatus } from "@/lib/mock";

const statusOrder: OrderStatus[] = ["new", "confirmed", "preparing", "out", "delivered", "cancelled"];
const statusColor: Record<string, string> = {
  new: "border-blue-300 dark:border-blue-700",
  confirmed: "border-emerald-300 dark:border-emerald-700",
  preparing: "border-amber-300 dark:border-amber-700",
  out: "border-purple-300 dark:border-purple-700",
  delivered: "border-zinc-300 dark:border-zinc-700",
  cancelled: "border-red-300 dark:border-red-700",
};

const statusBadge: Record<string, string> = {
  new: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
  confirmed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  preparing: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  out: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
  delivered: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export default function OrdersPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [view, setView] = useState<"board" | "list">("board");

  const advance = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== id) return o;
        const idx = statusOrder.indexOf(o.status);
        const next = statusOrder[Math.min(idx + 1, statusOrder.length - 1)];
        return { ...o, status: next === "cancelled" ? o.status : next };
      })
    );
  };

  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{T("orders")}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setView("board")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${view === "board" ? "bg-teal-500 text-white" : "border border-zinc-200 dark:border-zinc-700"}`}
          >
            Board
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${view === "list" ? "bg-teal-500 text-white" : "border border-zinc-200 dark:border-zinc-700"}`}
          >
            List
          </button>
        </div>
      </header>

      {view === "board" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusOrder.map((status) => (
            <div key={status} className={`min-w-[260px] flex-1 rounded-2xl border-t-4 bg-white p-3 shadow-sm dark:bg-zinc-900 ${statusColor[status]}`}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold">{T(status as any)}</h3>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                  {orders.filter((o) => o.status === status).length}
                </span>
              </div>
              <div className="space-y-2">
                {orders.filter((o) => o.status === status).map((o) => (
                  <div key={o.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-zinc-400">{o.id}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge[o.status]}`}>{T(o.status as any)}</span>
                    </div>
                    <p className="mt-1 font-medium">{o.customer}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">{o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</p>
                    <p className="mt-1 text-sm font-semibold tabular-nums">EGP {o.total}</p>
                    <p className="text-xs text-zinc-400">{o.address} · {o.payment}</p>
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => advance(o.id)}
                        className="flex-1 rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white hover:bg-teal-600"
                      >
                        {T("confirm")} →
                      </button>
                      <button className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700">{T("edit")}</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-sm">
            <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 text-start">ID</th>
                <th className="px-4 py-3 text-start">{T("customer")}</th>
                <th className="px-4 py-3 text-start">{T("items")}</th>
                <th className="px-4 py-3 text-start">{T("total")}</th>
                <th className="px-4 py-3 text-start">{T("address")}</th>
                <th className="px-4 py-3 text-start">{T("payment")}</th>
                <th className="px-4 py-3 text-start">{T("status")}</th>
                <th className="px-4 py-3 text-start">{T("fromChat")}</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 font-mono text-xs">{o.id}</td>
                  <td className="px-4 py-3">{o.customer}</td>
                  <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{o.items.map((i) => `${i.name} x${i.qty}`).join(", ")}</td>
                  <td className="px-4 py-3 tabular-nums">EGP {o.total}</td>
                  <td className="px-4 py-3">{o.address}</td>
                  <td className="px-4 py-3">{o.payment}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge[o.status]}`}>{T(o.status as any)}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-teal-600 dark:text-teal-400">{o.chatId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}