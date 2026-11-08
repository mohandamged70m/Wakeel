"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

export default function SettingsPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{T("settingsTitle")}</h1>
      </header>
      <div className="space-y-4">
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="font-medium">Auto-reply</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Currently ON · Business hours 09:00–21:00 Cairo</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="font-medium">WhatsApp connection</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Evolution API · instance: main · status: connected</p>
        </div>
        <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <h3 className="font-medium">Language</h3>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">Arabic (default) / English</p>
        </div>
      </div>
    </div>
  );
}