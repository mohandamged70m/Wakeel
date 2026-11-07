# Release Checklist

Owner: Rigel. Gate for MVP release. Every item must be checked or explicitly waived with owner (Mohand) sign-off recorded in the "Waivers" section. Source: `PLAN.md` §8 (definition of done), §7 (risks), `ARCHITECTURE.md` §6/§8.

## 0. Pre-flight (before any deploy)

- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm run build` passes (Next.js production build).
- [ ] Typecheck passes (`tsc --noEmit`) — no `any` in controllers/API clients.
- [ ] All env vars documented in `.env.example`; no secrets committed (grep for keys/tokens in git history).
- [ ] Supabase migration applied to production project; RLS enabled on all 14 tables (verify via `select tablename, rowsecurity from pg_tables where schemaname='public'`).
- [ ] Rollback plan written (section 6) and owner acknowledges.

## 1. Security

- [ ] Webhook signature/token verification active in prod (Evolution: `apikey` header compare; Meta: HMAC if enabled).
- [ ] Replay test: duplicate delivery does not double-send or double-create (FM-1).
- [ ] Cross-org RLS test passes (0 leaks) — `Docs/RLS-CROSS-ORG.md`.
- [ ] WhatsApp access tokens encrypted at rest (Supabase Vault or app-level AES); service role only in webhook/worker (grep).
- [ ] `/api/whatsapp/send` rate-limited per org.
- [ ] No PII in logs (phone numbers redacted or hashed in Sentry/PostHog).
- [ ] Auth: owner-only routes check role; staff cannot approve orders unless intended.

## 2. Functional (definition of done)

- [ ] Webhook signature verification + replay test pass.
- [ ] E2E order flow passes 3 consecutive runs (`Docs/E2E-ORDER-FLOW.md` HP-1, A1–A10).
- [ ] Cross-org RLS test passes.
- [ ] Price-accuracy eval: 20/20, 0 wrong prices (`Docs/EVAL-PRICE-ACCURACY.md`).
- [ ] Dashboard works at 360px, light + dark (`Docs/VISUAL-AUDIT.md`).
- [ ] Owner can fully disable auto-reply; agent stops within one message (FM-10).
- [ ] Urgent keyword triggers owner notification within 5s (case 13).
- [ ] Business hours away-message works (FM-8).
- [ ] Owner approval gate: no auto-confirm (FM-4).
- [ ] Customer confirmation sent on approve (A9).

## 3. Data & migrations

- [ ] Migration is idempotent / re-runnable; no data loss on re-apply.
- [ ] Seed/demo data script works and is clearly marked "Demo data — not real".
- [ ] Backup: Supabase PITR enabled (free tier: daily backups) or manual dump documented.
- [ ] `order_items` price snapshots populated (never recomputed from current menu).

## 4. Observability & ops

- [ ] Sentry receiving errors (web + edge) — trigger a test error and confirm.
- [ ] PostHog receiving events: conversation started, order drafted, order approved, auto-reply toggled.
- [ ] Inngest dashboard shows jobs healthy; retry policy documented.
- [ ] LLM token usage logged per org in `audit_log` meta.
- [ ] Health check endpoint (if added) returns 200; Evolution session state monitored; alert on disconnect.
- [ ] Runbook: how to re-scan QR, how to reset demo data, how to rotate webhook token.

## 5. Performance

- [ ] Inbox loads < 2s on 3G for 1k conversations (virtualized list if needed).
- [ ] No N+1 queries in conversation list (check Supabase logs).
- [ ] LLM calls capped (maxSteps=5, token cap) per `ARCHITECTURE.md` §2.

## 6. Rollback plan

- **Code:** Vercel instant rollback to previous deployment (keep last 3 deployments). Command: Vercel dashboard → Deployments → Promote previous.
- **DB:** Supabase PITR to timestamp before deploy; if migration added columns, rollback migration script must drop them (provide `down.sql` for every `up.sql`).
- **WhatsApp session:** if Evolution instance breaks during deploy, re-scan QR via dashboard; document in runbook. No data loss (messages persisted).
- **Feature flags:** auto-reply defaults to OFF for new orgs; existing orgs keep their setting on rollback (no migration of settings).
- **Rollback trigger criteria:** any cross-org data leak, any wrong price in prod, webhook 5xx rate > 1%, or owner notification failure > 5 min.

## 7. Post-release checks (first 24h)

- [ ] Smoke test: send a real WhatsApp message, receive reply, place order, approve, confirm — within 30 min of deploy.
- [ ] Monitor Sentry for new errors (target: 0 new error types in first 24h).
- [ ] Monitor Inngest for failed jobs (target: 0 failures).
- [ ] Monitor Evolution session state (target: connected).
- [ ] Check PostHog: at least one conversation + one order event if traffic exists.
- [ ] Owner feedback loop: message founder within 24h with any friction.

## 8. Communication

- [ ] Changelog entry written (user-facing: what's new, what's fixed).
- [ ] Demo video / Loom updated if UI changed.
- [ ] Known limitations documented (Evolution unofficial API ban risk, one number per org, manual payments).
- [ ] Support channel (WhatsApp/email) monitored for first 48h.

## 9. Waivers (record any skipped item)

| Item | Reason | Approved by | Date |
|---|---|---|---|
| (none yet) | | | |

## Sign-off

- Rigel (QA/Release): ______  Date: ______
- Ada (Tech Lead): ______  Date: ______
- Mohand (Owner): ______  Date: ______

Release decision: **Ready / Ready with conditions / Not ready** — (circle one) with evidence linked.
