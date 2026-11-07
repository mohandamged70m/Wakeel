"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { leads } from "@/lib/mock";

export default function LeadsPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const statusColor: Record<string, string> = {
    new: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300",
    contacted: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
    qualified: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  };
  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{T("leadsTitle")}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Less central — kept for prospects</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 text-start">{T("customer")}</th>
              <th className="px-4 py-3 text-start">Phone</th>
              <th className="px-4 py-3 text-start">Source</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-start">Note</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3 font-medium">{l.name}</td>
                <td className="px-4 py-3">{l.phone}</td>
                <td className="px-4 py-3">{l.source}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[l.status]}`}>{l.status}</span>
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{l.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}