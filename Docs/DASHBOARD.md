# Dashboard Design Spec — WhatsApp Order SaaS

Inspiration: Linear (speed, density, keyboard), Stripe (tables), Attio (CRM inbox), Intercom (bot handoff), WhatsApp Business (familiar chat), Vercel (dark-first). Galleries: SaaSUI, Mobbin, SaaSFrame.

## 1. Principles

- Owner uses daily → dark-first with light toggle; `prefers-color-scheme` default.
- Palette: cream `#F3EEE3` background, ink `#111111` text, burnt orange `#D9541E` accent (light) / `#E86A33` (dark); warm stone neutrals otherwise.
- Typography: Inter for English/Latin, IBM Plex Sans Arabic for Arabic; `display: swap`; family switches by `lang`/`dir`.
- Tabular nums in tables/axes; proportional for KPIs.
- Space 4/8/12/16/24/32. Cards `rounded-2xl`, hairline borders.
- 360px support; RTL for Arabic (logical properties, `dir="rtl"`).
- Empty/loading/error states designed.

## 2. Sidebar IA

Overview · Inbox (unread badge) · Orders (pending badge) · Menu & Prices · Customers · Automations · Analytics · Settings · Billing (later) · Team (later).

## 3. Screens

### Overview
KPIs: Conversations today, Orders pending approval, Revenue this week, Avg first-response. Urgent alerts banner. Recent activity feed. Mini chart orders by day + top 3 items.

### Inbox (hero, tri-pane)
Left: conversation list (avatar, name/phone, preview, timestamp, status dot, unread). Filters All/Needs reply/Bot/Human. Search.
Center: chat bubbles, media, composer, quick replies, "Take over"/"Return to bot".
Right: customer card, current draft order with Approve/Edit/Reject, metadata.

### Orders
Kanban (Draft pending/Confirmed/Preparing/Ready/Delivered/Cancelled) or Table. Order detail drawer: items with price snapshots, approval history, payment status, actions.

### Menu & Prices
Categories as tabs; item cards with image, name (AR/EN), price, availability toggle; add/edit modal; CSV import/export.

### Customers
Table → profile drawer with conversation history + orders + notes.

### Automations
Big auto-reply toggle; business hours; urgent keywords; away message; AI persona (tone + custom instructions); WhatsApp connection status (QR, state, reconnect).

### Analytics
KPIs + orders by day, top items, peak hours, conversion funnel; date range + CSV export.

## 4. Component kit

KpiCard, StatusPill, ConversationRow, MessageBubble, Composer, OrderCard, OrderDetailDrawer, MenuItemCard, MenuItemForm, DataTable, EmptyState, LoadingSkeleton, ErrorState, ConfirmDialog, Toast. Theme provider + CSS variables.

## 5. Accessibility

Keyboard j/k/Enter/Esc, visible focus, contrast ≥4.5:1, `prefers-reduced-motion`, chart aria-labels stating takeaway.

## 6. RTL

Use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`). Set `dir` from user locale. Test all screens in RTL.

## 7. Inspiration galleries

SaaSUI, Mobbin, SaaSFrame, AdminLTE "10 SaaS dashboards 2026", Muzli "50 best dashboards 2026". Steal: Linear density, Stripe tables, Attio sidebar, Intercom tri-pane, Vercel dark tokens.