"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ui/ThemeProvider";
import { t } from "@/lib/i18n";
import {
  LayoutDashboard,
  Inbox,
  Target,
  Receipt,
  Users,
  BookOpen,
  Settings,
  Sun,
  Moon,
  Wifi,
} from "lucide-react";

const navItems = [
  { key: "overview", href: "/dashboard", icon: LayoutDashboard },
  { key: "inbox", href: "/dashboard/inbox", icon: Inbox },
  { key: "leads", href: "/dashboard/leads", icon: Target },
  { key: "orders", href: "/dashboard/orders", icon: Receipt },
  { key: "topClients", href: "/dashboard/clients", icon: Users },
];

const manageItems = [
  { key: "knowledge", href: "/dashboard/knowledge", icon: BookOpen },
  { key: "settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const { locale, setLocale } = useLocale();
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const T = (k: any) => t(locale, k);

  const linkClass = (href: string) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
      pathname === href
        ? "bg-accent-soft text-accent"
        : "text-ink-muted hover:bg-bg-subtle"
    }`;

  return (
    <aside className="flex h-screen w-64 flex-col border-e border-border bg-surface">
      <div className="flex items-center gap-2 px-4 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-accent-ink font-bold">W</span>
        <span className="text-base font-semibold tracking-tight text-ink">{T("app")}</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        <p className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{T("overview")}</p>
        {navItems.map((n) => {
          const Icon = n.icon;
          return (
            <Link key={n.key} href={n.href} className={linkClass(n.href)}>
              <Icon size={16} aria-hidden="true" />
              <span>{T(n.key as any)}</span>
            </Link>
          );
        })}
        <p className="px-3 pt-4 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{T("manage")}</p>
        {manageItems.map((n) => {
          const Icon = n.icon;
          return (
            <Link key={n.key} href={n.href} className={linkClass(n.href)}>
              <Icon size={16} aria-hidden="true" />
              <span>{T(n.key as any)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-border p-3">
        <div className="flex items-center justify-between rounded-lg bg-bg-subtle px-3 py-2">
          <span className="text-xs text-ink-muted">{T("connected")}</span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <Wifi size={12} aria-hidden="true" /> {T("connected")}
          </span>
        </div>
        <button
          onClick={() => setLocale(locale === "ar" ? "en" : "ar")}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:bg-bg-subtle"
        >
          <span>{T("language")}</span>
          <span className="rounded bg-bg-subtle px-1.5 py-0.5">{locale === "ar" ? "AR" : "EN"}</span>
        </button>
        <button
          onClick={toggle}
          className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:bg-bg-subtle"
          aria-label="Toggle theme"
        >
          <span>Theme</span>
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <div className="flex items-center gap-3 rounded-lg px-2 py-1.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-accent font-semibold text-sm">A</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">Ahmed (Owner)</p>
            <p className="truncate text-xs text-ink-muted">{T("profile")}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}