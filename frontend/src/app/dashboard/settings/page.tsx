"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";
import { useWhatsappStatus } from "@/hooks/useAnalytics";
import { useAutomations } from "@/hooks/useAutomations";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/LoadingSkeleton";
import { Wifi, Bot, Languages, Clock } from "lucide-react";

export default function SettingsPage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const waQ = useWhatsappStatus();
  const autoQ = useAutomations();

  if (waQ.isLoading || autoQ.isLoading) return <div className="p-6"><LoadingSkeleton lines={6} /></div>;
  if (waQ.isError || autoQ.isError) return <ErrorState message="Failed to load settings" />;

  const wa = waQ.data;
  const auto = autoQ.data;

  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight">{T("settingsTitle")}</h1>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Wifi size={16} className="text-ink-muted" />
            <h3 className="font-medium text-ink">WhatsApp connection</h3>
          </div>
          <p className="mt-2 text-sm text-ink">
            Status:{" "}
            <span className={`font-semibold ${wa?.connected ? "text-success" : "text-danger"}`}>
              {wa?.connected ? T("connected") : T("disconnected")}
            </span>
          </p>
          <p className="mt-1 text-xs text-ink-muted">Evolution API · instance: main · state: {wa?.state ?? "—"}</p>
          <p className="mt-1 text-xs text-ink-muted">
            Last seen: {wa?.lastSeen ? new Date(wa.lastSeen).toLocaleString() : "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Bot size={16} className="text-ink-muted" />
            <h3 className="font-medium text-ink">Auto-reply</h3>
          </div>
          <p className="mt-2 text-sm text-ink">
            {auto?.autoReplyEnabled ? "ON" : "OFF"} · {T("businessHours")} 09:00–21:00 Cairo
          </p>
          <p className="mt-1 text-xs text-ink-muted">Persona: {auto?.personaPrompt ?? "—"}</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-ink-muted" />
            <h3 className="font-medium text-ink">Business hours</h3>
          </div>
          <p className="mt-2 text-sm text-ink">09:00 – 21:00 (Africa/Cairo)</p>
          <p className="mt-1 text-xs text-ink-muted">Auto-reply paused outside these hours with away message.</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <Languages size={16} className="text-ink-muted" />
            <h3 className="font-medium text-ink">Language</h3>
          </div>
          <p className="mt-2 text-sm text-ink">Arabic (default) / English</p>
          <p className="mt-1 text-xs text-ink-muted">Toggle from the sidebar.</p>
        </div>
      </div>
    </div>
  );
}