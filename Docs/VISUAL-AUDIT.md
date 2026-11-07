# Responsive / RTL Visual Audit Checklist

Owner: Rigel (with Pixel for fixes). Scope: all 8 screens from `DASHBOARD.md` §2/§3. Run on the deployed preview (or `npm run dev` + device emulation). Sign-off required before release.

## Environments to test

- Viewports: 360×640 (mobile), 768×1024 (tablet), 1280×800 (desktop), 1440×900 (wide).
- Themes: light + dark (toggle + `prefers-color-scheme`).
- Directions: LTR (English) + RTL (Arabic). Test with `dir="rtl"` and Arabic locale; verify no horizontal scroll at 360px except wide tables inside their own scroll box.
- Browsers: Chrome (latest), Safari (latest, iOS), Firefox (latest). At minimum Chrome + Safari for release.

## Global checks (apply to every screen)

- [ ] No horizontal scroll at 360px except wide tables inside `.overflow-x-auto` container.
- [ ] Touch targets ≥ 36×36px (buttons, toggles, list rows).
- [ ] Focus ring visible on every interactive element (Tab through).
- [ ] Contrast ≥ 4.5:1 for body text, ≥ 3:1 for large text/UI in both themes (use axe or Lighthouse).
- [ ] `prefers-reduced-motion`: no pulse on pending-approval badge, no auto-animations.
- [ ] Empty/loading/error states present (not blank, not spinner-only).
- [ ] Arabic text renders with correct font; numbers tabular where specified.

## Keyboard (global)

- [ ] `j` / `k` navigate conversation list (Inbox).
- [ ] `Enter` opens selected conversation / drawer.
- [ ] `Esc` closes drawer / modal / command palette.
- [ ] `Cmd/Ctrl+K` opens command palette (if implemented) — not a release blocker if deferred, but note.
- [ ] Tab order logical; no focus traps.

## Screen: Overview

- [ ] KPI row (4 tiles) wraps to 2×2 at 360px, 4×1 at ≥768px; no clipping of values.
- [ ] Auto-reply pill + toggle visible and operable at 360px.
- [ ] Urgent alerts banner red-tinted, readable in dark mode.
- [ ] Recent activity feed scrolls within its card (not the page).
- [ ] Mini chart (orders by day) renders; aria-label states takeaway.
- [ ] Top 3 items list legible.

## Screen: Inbox (hero)

- [ ] Desktop: 3-column layout (list 320 / chat flex / panel 320). At 1280+ no overlap.
- [ ] Tablet: collapses to list+chat or chat+panel; no 3 columns squeezed.
- [ ] Mobile: list → chat → back navigation; right panel becomes a drawer/sheet.
- [ ] Conversation row: avatar initials, name/phone, preview, timestamp, status dot, unread badge — no overflow at 360px; preview truncates with ellipsis.
- [ ] Filters (All/Needs reply/Bot/Human) fit in one row or wrap cleanly; search input ≥ 44px height.
- [ ] Chat bubbles: in/out distinction clear in both themes; media renders; timestamps not clipped.
- [ ] "bot" badge on assistant messages visible but not noisy.
- [ ] Composer: text + quick replies + Take over toggle + Send menu; usable at 360px (stack if needed).
- [ ] Human mode shows "Return to bot" button.
- [ ] Right panel: customer card, draft order with Approve/Edit/Reject, metadata — drawer on mobile, no horizontal scroll.
- [ ] Auto-reply-disabled amber banner persistent when bot off.

## Screen: Orders

- [ ] View toggle Kanban/Table works; Kanban columns scroll horizontally within container (allowed) at 360px, not the page.
- [ ] Order card: #id, customer, items summary, total, created, status pill, Approve action — no truncation of total.
- [ ] Order detail drawer: full items with price snapshots, customer, conversation link, approval history, payment status, actions — scrollable, closes on Esc.
- [ ] Filters (status, date range, customer, search) fit; date picker usable on mobile.
- [ ] Empty state: "No orders yet" with next step.

## Screen: Menu & Prices

- [ ] Category tabs/sections wrap or scroll horizontally within container.
- [ ] Item card: image, name, description, price (tabular), availability toggle, edit — toggle ≥ 36px.
- [ ] Add/edit modal: all fields visible at 360px; image upload works; modal scrolls internally.
- [ ] Bulk actions (import CSV, export, toggle availability) accessible.
- [ ] Price changes show audit note.

## Screen: Customers

- [ ] Table: name, phone, tags, orders count, last seen, total spent. At 360px either horizontal scroll within table box OR card layout; no page scroll.
- [ ] Click → profile drawer with conversation history + orders + notes.
- [ ] Empty state present.

## Screen: Automations

- [ ] Big auto-reply toggle with confirmation dialog + "what happens" explainer.
- [ ] Business hours: day chips + time range + timezone usable at 360px.
- [ ] Urgent keywords tag input.
- [ ] Away message textarea.
- [ ] AI persona tone selector + custom instructions textarea with guardrails note.
- [ ] WhatsApp connection status card: number, status, last webhook, test button, reconnect.

## Screen: Analytics

- [ ] KPIs row wraps.
- [ ] Charts: orders by day (line), top items (bar), peak hours, conversion funnel — each has aria-label stating takeaway.
- [ ] Date range picker usable on mobile.
- [ ] Export CSV works.
- [ ] No chart overflows container; legends don't collide with title.

## Screen: Settings

- [ ] Forms usable at 360px; labels not clipped.
- [ ] Danger zone (delete org etc.) clearly separated.

## RTL-specific (Arabic)

- [ ] Sidebar flips to right; icons order correct; unread badges on correct side.
- [ ] Text alignment right; numbers remain LTR within Arabic text (use `dir="ltr"` on number spans or `unicode-bidi`).
- [ ] Chat bubbles: outgoing on left? Decide convention (WhatsApp puts outgoing on right in both LTR/RTL? Actually WhatsApp flips). Document chosen convention: outgoing on the side consistent with reading direction of the UI language; verify with an Arabic user. **Decision needed before release — flag to Mohand.**
- [ ] Tables: header alignment follows direction; action buttons on correct side.
- [ ] No mixed-direction layout breakage in mixed AR/EN content (customer names, phone numbers).
- [ ] Date/time formatting uses Arabic-Indic or Western digits consistently (pick one; recommend Western digits for prices/phones, Arabic for prose dates — document).

## Anti-slop guardrails (from execution plan §5)

- [ ] No emoji used as icons; all icons from one icon set (Lucide or Radix icons), sized consistently.
- [ ] No default shadcn template leftovers (default blue accent, default font stack unchanged, placeholder "Acme Inc" text).
- [ ] No inline magic colors; all colors via design tokens (CSS variables).
- [ ] All 8 screens have empty/loading/error states implemented.
- [ ] No mock data in runtime code paths (data comes from Supabase or clearly-marked demo seed).
- [ ] i18n complete: no hardcoded English strings in components (all via dictionary); AR + EN both render.
- [ ] No `any` in component props / API client types.
- [ ] RTL audited (this doc).

## Sign-off

- Tester: ______  Date: ______
- Screens passed: ___/8
- Open issues filed: (link)
- Release blocker if any screen fails global checks or RTL breaks layout.
