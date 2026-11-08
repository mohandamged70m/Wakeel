"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useCustomers } from "@/hooks/useCustomers";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/LoadingSkeleton";

export default function ClientsPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const q = useCustomers();

  if (q.isLoading) return <div className="p-6"><LoadingSkeleton lines={6} /></div>;
  if (q.isError) return <ErrorState message="Failed to load customers" />;
  const items = q.data?.items ?? [];
  if (items.length === 0) return <EmptyState title="No customers yet" description="Customers will appear here." />;

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{T("topClients")}</h1>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="py-2 px-4 text-start">{T("customer")}</th>
              <th className="py-2 px-4 text-start">{T("phone" as any) ?? "Phone"}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => (
              <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 px-4">{c.name ?? "—"}</td>
                <td className="py-2 px-4">{c.phone}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


