"use client";
import { useLocale } from "@/components/LanguageProvider";
import { t } from "@/lib/i18n";

export default function KnowledgePage() {
  const { locale } = useLocale();
  const T = (k: any) => t(locale, k);
  const items = [
    { title: "Menu: Chicken Shawarma", body: "65 EGP - grilled chicken, garlic sauce, pickles" },
    { title: "Menu: Falafel Wrap", body: "40 EGP - fried falafel, tahini, veggies" },
    { title: "Menu: Mixed Grill", body: "180 EGP - lamb + chicken + kofta" },
    { title: "FAQ: Delivery areas", body: "Cairo & Giza only, 30-45 min" },
    { title: "FAQ: Payment", body: "COD, bank transfer, mobile wallet" },
  ];
  return (
    <div className="p-6">
      <header className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{T("knowledgeTitle")}</h1>
        <p className="text-sm text-ink-muted">Product catalog and FAQs the agent uses to answer price questions</p>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="font-medium text-ink">{it.title}</p>
            <p className="mt-1 text-sm text-ink-muted">{it.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}