"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { clients } from "@/lib/mock";

const tagColor: Record<string, string> = {
  vip: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  returning: "bg-teal-100 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300",
  inactive30: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

const tagLabel: Record<string, string> = {
  vip: "VIP",
  returning: "Returning",
  inactive30: "Inactive 30+",
};

export default function ClientsPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const sorted = [...clients].sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{T("topClients")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Ranked by total spend</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-start">#</th>
              <th className="px-4 py-3 text-start">{T("customer")}</th>
              <th className="px-4 py-3 text-start">{T("ordersCount")}</th>
              <th className="px-4 py-3 text-start">{T("totalSpent")}</th>
              <th className="px-4 py-3 text-start">{T("lastOrder")}</th>
              <th className="px-4 py-3 text-start">{T("avgOrder")}</th>
              <th className="px-4 py-3 text-start">Tags</th>
              <th className="px-4 py-3 text-start">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c, i) => (
              <tr key={c.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-semibold text-zinc-400">{i + 1}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">{c.phone}</p>
                </td>
                <td className="px-4 py-3 tabular-nums">{c.orders}</td>
                <td className="px-4 py-3 tabular-nums font-semibold">EGP {c.totalSpent.toLocaleString()}</td>
                <td className="px-4 py-3">{c.lastOrder}</td>
                <td className="px-4 py-3 tabular-nums">EGP {c.avgOrder}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {c.tags.map((tag) => (
                      <span key={tag} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${tagColor[tag]}`}>
                        {tagLabel[tag]}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button className="rounded-md bg-teal-500 px-2 py-1 text-xs font-medium text-white hover:bg-teal-600">{T("sendOffer")}</button>
                    <button className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-700">{T("message")}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}