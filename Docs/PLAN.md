# WhatsApp Auto-Reply + Order SaaS — Implementation Plan

Stack: **Frontend** Next.js 15 (App Router) + React 19 + TS + Tailwind v4 + shadcn/ui · **Backend** NestJS (modular) · **DB/Auth** Supabase (Postgres, Auth, RLS, Realtime, Storage) · **WhatsApp** Evolution API (self-hosted, Baileys) · **AI** OpenAI (chat + Whisper + vision) · **Jobs** NestJS + BullMQ on Redis (or Inngest) · **Payments** Stripe (SaaS) + Paymob/Fawry (orders, Egypt) · **Hosting** VPS Docker Compose (app + Evolution + Postgres + Redis) for portfolio/demo.

Owner: you (founder). Tech Lead: Ada. Team: Rigel (QA/Release), Pixel (Frontend), Lin (Backend).

## 1. Product in one paragraph

A multi-tenant SaaS where a business owner connects their WhatsApp number via Evolution API. An AI agent (OpenAI) replies to customers (only when the owner permits auto-reply), shows the menu/price list, collects an order, and creates a **draft order that the owner must approve** before it's confirmed. Urgent messages and every new customer are forwarded to the owner. A web dashboard (Next.js) lets the owner manage conversations, approve orders, edit the menu, and toggle automation. Portfolio/demo mode included so prospects can try it instantly.

## 2. Scope (MVP vs later)

**MVP:** owner signup/login, connect one WhatsApp number (Evolution, QR scan), auto-reply toggle + business hours + escalation keywords, AI agent answers FAQs/sends menu+prices/builds order draft, owner approval gate on every order (dashboard + WhatsApp notification), urgent detection → owner ping, menu/price CRUD, customer list, conversation inbox, basic analytics, demo seed data.

**Later (v1.1+):** phone app (Expo), broadcasts/templates, multi-number, team seats, WhatsApp Flows, voice (Calling API), multi-language beyond AR/EN.

Assumption: one WhatsApp number per org in MVP. `whatsapp_accounts` is 1:N to `organizations`, so multi-number is a config change.

## 3. Why this stack

- **NestJS backend** gives clean modular boundaries (auth, whatsapp, ai, orders, billing) and DI; better than cramming everything into Next route handlers for a sellable product.
- **Supabase** = Postgres + Auth + RLS + Realtime inbox + Storage in one vendor; RLS protects multi-tenant data.
- **Evolution API** avoids Meta business verification and template approval during portfolio/demo phase; provider is abstracted so Meta can be swapped in later.
- **OpenAI** for chat (tool-use), Whisper for voice notes, vision for menu photos.
- **Docker Compose on one VPS** = one-command demo for prospects (~$8-15/mo).

Caveats: Evolution is unofficial (Baileys) → ban risk + phone must stay online. Mitigate with health checks and offer Meta upgrade path.

## 4. Architecture

```
Customer (WhatsApp)
  -> Evolution API (self-hosted)
  -> POST /webhooks/whatsapp (NestJS)
       - verify apikey header
       - normalize MESSAGES_UPSERT payload
       - idempotency by message id
       - enqueue BullMQ job: process-message
  -> Worker: processMessage
       - load org settings + history
       - if auto-reply off / outside hours / urgent -> escalate, notify owner
       - else run OpenAI agent with tools: getMenu, getPrice, createOrderDraft, getOrderStatus, escalateToOwner
       - send reply via Evolution REST
       - persist messages
  -> Owner dashboard (Supabase Realtime) shows new conversation/order
  -> Owner approves order -> status confirmed -> notify customer + payment link
```

Invariants:
- Prices never from LLM memory. `getPrice`/`getMenu` tools read Postgres; system prompt forbids quoting prices without a tool call.
- Every order needs owner approval in MVP.
- Idempotent webhook.
- RLS by org on every table.

## 5. Data model

See `ARCHITECTURE.md` for full SQL. Core tables: `organizations`, `users`, `whatsapp_accounts`, `customers`, `conversations`, `messages`, `menu_categories`, `menu_items`, `orders`, `order_items`, `approvals`, `escalations`, `automations`, `audit_log`.

## 6. Phases and ownership

| Phase | Weeks | Owner | Deliverable |
|---|---|---|---|
| 0. Foundation | 1 | Lin | Monorepo (backend+frontend), Supabase schema+RLS, auth, Docker Compose, CI |
| 1. WhatsApp pipe | 2 | Lin | Evolution webhook + receive + send + conversation storage + inbox (manual reply) |
| 2. Catalog + orders | 1 | Lin + Pixel | Menu CRUD, order draft flow, owner approval gate, notifications |
| 3. AI agent | 1 | Lin | OpenAI agent with tools, auto-reply permission, escalation, urgent detection, AR/EN |
| 4. Dashboard | 1 | Pixel | Overview, inbox, orders, menu, customers, automations, analytics |
| 5. Demo mode + hardening | 1 | Rigel | Seed data, reset, E2E order flow, RLS tests, price-accuracy eval, launch checklist |

Total MVP: ~6 weeks. Phone app deferred.

## 7. Risks and mitigations

- **Evolution session fragility.** Phone must stay online; dead battery breaks everything. Mitigate: health-check cron + "session disconnected" alert; document re-scan QR; Meta as upgrade path.
- **Ban risk.** Only message customers who initiated; rate-limit; opt-in in demo.
- **LLM hallucinating prices.** Tool-only pricing + eval harness (Rigel owns 20 scripted conversations, 0 wrong prices).
- **Multi-tenant data leak.** RLS + integration tests asserting cross-org reads return empty.
- **Egypt payments.** SaaS billing via Stripe or Paddle/LemonSqueezy (merchant of record). Order payments via Paymob/Fawry. Don't block MVP on payments.
- **Arabic + English from day 1.** Bilingual agent persona; menu names in both; RTL layout for Arabic.

## 8. Verification (definition of done)

- [ ] Webhook token verification + idempotency test pass.
- [ ] E2E: customer asks price → agent quotes from DB → customer orders → draft created → owner approves → customer gets confirmation.
- [ ] Cross-org RLS test passes.
- [ ] Price-accuracy eval: 20 conversations, 0 wrong prices.
- [ ] Dashboard works at 360px, light + dark, AR RTL.
- [ ] Owner can disable auto-reply; agent stops within one message.
- [ ] Urgent keyword triggers owner notification within 5s.
- [ ] `docker compose up` brings up whole stack; demo seed loads.

## 9. Immediate next steps (this week)

1. Lin: scaffold monorepo (backend NestJS + frontend Next.js) in `D:\projects\Agent for whatsapp`.
2. Lin: spin up Evolution API via Docker, scan QR, verify webhook round-trip.
3. Lin: create Supabase project, run schema migration, enable RLS.
4. Pixel: dashboard shell + design tokens + RTL.
5. Rigel: price-accuracy eval set + E2E test plan.
6. You: decide SaaS billing provider (Stripe vs Paddle) and pricing tiers; record demo script.

## 10. Open questions for you

- SaaS pricing model: per-number flat vs per-conversation? (Recommend flat tiers.)
- Should owners edit AI tone/persona, or one default voice?
- Demo language: Arabic-first with English fallback, or bilingual side-by-side?
- Do you want a public demo link or local-only demo for portfolio?