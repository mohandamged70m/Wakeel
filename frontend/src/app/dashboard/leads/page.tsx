"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { EmptyState } from "@/components/ui/EmptyState";

export default function LeadsPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-semibold tracking-tight">{T("leadsTitle")}</h1>
      <EmptyState title="Leads module coming soon" description="Lead capture and qualification will be available in a later phase." />
    </div>
  );
}