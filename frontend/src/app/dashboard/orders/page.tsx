"use client";
import { useState } from "react";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useOrders } from "@/hooks/useOrders";
import { useOrder } from "@/hooks/useOrders";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/LoadingSkeleton";
import { OrderDetailDrawer } from "@/components/ui/OrderDetailDrawer";
import { StatusPill } from "@/components/ui/StatusPill";
import { Check, X, Eye } from "lucide-react";

const statusLabel: Record<string, string> = {
  draft_pending_owner: "Draft (needs you)",
  confirmed: "Confirmed",
  preparing: "Preparing",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

export default function OrdersPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const qc = useQueryClient();
  const q = useOrders();
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (q.isLoading) return <div className="p-6"><LoadingSkeleton lines={6} /></div>;
  if (q.isError) return <ErrorState message="Failed to load orders" />;
  const items = q.data?.items ?? [];
  if (items.length === 0) return <EmptyState title="No orders yet" description="Orders will appear here." />;

  const detailQ = useOrder(openId);

  async function handleApprove(id: string) {
    setBusy(true);
    try {
      await api.orders.approve(id);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", id] });
    } finally {
      setBusy(false);
    }
  }
  async function handleReject(id: string) {
    setBusy(true);
    try {
      await api.orders.reject(id);
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["order", id] });
    } finally {
      setBusy(false);
    }
  }

  const openOrder = items.find((o) => o.id === openId) ?? null;
  const detail = detailQ.data;

  return (
    <div className="p-6">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{T("orders")}</h1>
        <span className="text-xs text-ink-muted">{items.length} total</span>
      </header>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {items.map((o) => (
          <div key={o.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink-subtle">{o.id}</span>
              <StatusPill status={o.status} label={statusLabel[o.status] ?? o.status} />
            </div>
            <p className="mt-1 font-medium text-ink">{o.customerId}</p>
            <p className="mt-1 text-sm tabular-nums text-ink">{o.currency} {o.total}</p>
            <p className="mt-1 text-xs text-ink-muted">{o.notes}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setOpenId(o.id)}
                className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink hover:bg-bg-subtle"
              >
                <Eye size={12} className="me-1 inline" /> View
              </button>
              {o.status === "draft_pending_owner" ? (
                <>
                  <button
                    onClick={() => handleApprove(o.id)}
                    disabled={busy}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-50"
                  >
                    <Check size={12} className="me-1 inline" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(o.id)}
                    disabled={busy}
                    className="rounded-lg border border-danger/40 px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger/5 disabled:opacity-50"
                  >
                    <X size={12} className="me-1 inline" /> Reject
                  </button>
                </>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-2xl border border-border bg-surface md:block">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-ink-muted">
            <tr>
              <th className="px-4 py-3 text-start">ID</th>
              <th className="px-4 py-3 text-start">{T("customer")}</th>
              <th className="px-4 py-3 text-start">{T("items")}</th>
              <th className="px-4 py-3 text-start">{T("total")}</th>
              <th className="px-4 py-3 text-start">{T("status")}</th>
              <th className="px-4 py-3 text-start">{T("payment")}</th>
              <th className="px-4 py-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id} className="border-t border-border hover:bg-bg-subtle">
                <td className="px-4 py-3 font-mono text-xs text-ink-subtle">{o.id}</td>
                <td className="px-4 py-3 text-ink">{o.customerId}</td>
                <td className="px-4 py-3 text-ink-muted">—</td>
                <td className="px-4 py-3 tabular-nums text-ink">{o.currency} {o.total}</td>
                <td className="px-4 py-3">
                  <StatusPill status={o.status} label={statusLabel[o.status] ?? o.status} />
                </td>
                <td className="px-4 py-3 text-ink-muted">{o.paymentStatus ?? "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setOpenId(o.id)}
                      className="rounded-md border border-border px-2 py-1 text-xs text-ink hover:bg-bg-subtle"
                    >
                      View
                    </button>
                    {o.status === "draft_pending_owner" ? (
                      <>
                        <button
                          onClick={() => handleApprove(o.id)}
                          disabled={busy}
                          className="rounded-md bg-accent px-2 py-1 text-xs text-accent-ink hover:bg-accent-hover disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(o.id)}
                          disabled={busy}
                          className="rounded-md border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/5 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrderDetailDrawer open={!!openId} title={openId ?? "Order"} onClose={() => setOpenId(null)}>
        {detailQ.isLoading ? (
          <LoadingSkeleton lines={4} />
        ) : detail ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-ink-subtle">{detail.id}</span>
              <StatusPill status={detail.status} label={statusLabel[detail.status] ?? detail.status} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-muted">{T("customer")}</p>
              <p className="text-sm text-ink">{detail.customerId}</p>
              <p className="text-xs text-ink-muted">{detail.notes}</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold text-ink-muted">{T("items")}</p>
              <ul className="space-y-2">
                {detail.items.map((it: { id: string; nameSnapshot: string; qty: number; subtotal: number }) => (
                  <li key={it.id} className="flex items-center justify-between rounded-lg bg-bg-subtle px-3 py-2 text-sm">
                    <span className="text-ink">
                      {it.nameSnapshot} <span className="text-ink-muted">×{it.qty}</span>
                    </span>
                    <span className="tabular-nums text-ink">{it.subtotal}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-semibold text-ink">{T("total")}</span>
              <span className="text-lg font-semibold tabular-nums text-ink">
                {detail.currency} {detail.total}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-ink-muted">
              <span>{T("payment")}: {detail.paymentStatus ?? "—"}</span>
              <span>{new Date(detail.createdAt).toLocaleString()}</span>
            </div>
            {openOrder?.status === "draft_pending_owner" ? (
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleApprove(openOrder.id)}
                  disabled={busy}
                  className="flex-1 rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-ink hover:bg-accent-hover disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReject(openOrder.id)}
                  disabled={busy}
                  className="flex-1 rounded-lg border border-danger/40 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-ink-muted">No details.</p>
        )}
      </OrderDetailDrawer>
    </div>
  );
}