# RLS Cross-Org Test Plan

Owner: Rigel. Goal: prove multi-tenant isolation — org A cannot read org B's rows on any tenant-scoped table. Source: `ARCHITECTURE.md` §4/§6, `PLAN.md` §4 invariants.

## Tables under test (all must have RLS enabled)

organizations, users, whatsapp_accounts, customers, conversations, messages, menu_categories, menu_items, orders, order_items, approvals, escalations, automations, audit_log.

## Setup (run once per test DB)

```sql
-- Two orgs
insert into organizations (id, name, slug, timezone, currency) values
  ('11111111-1111-1111-1111-111111111111','Org A','org-a','Africa/Cairo','EGP'),
  ('22222222-2222-2222-2222-222222222222','Org B','org-b','Africa/Cairo','EGP');

-- Two owner users (auth.users must exist; use Supabase admin API or a test seed that creates auth users)
insert into users (id, organization_id, role, display_name) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','11111111-1111-1111-1111-111111111111','owner','Owner A'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','22222222-2222-2222-2222-222222222222','owner','Owner B');

-- Seed one row per tenant-scoped table for each org (minimal)
insert into customers (id, organization_id, phone, name) values
  ('c-a','11111111-1111-1111-1111-111111111111','+201000000001','Customer A'),
  ('c-b','22222222-2222-2222-2222-222222222222','+201000000002','Customer B');
-- ... (conversations, messages, menu_categories, menu_items, orders, order_items, approvals, escalations, automations, audit_log, whatsapp_accounts)
```

A full seed script `tests/seed-rls.sql` (to be added by Lin) must populate at least one row in every table for both orgs, with deterministic ids prefixed `a-` / `b-`.

## Test method

Use Supabase client with a user JWT (anon key + user session), NOT the service role. The service role bypasses RLS and must only be used by the test harness to seed/teardown, never to assert.

For each table T and each operation:

1. Authenticate as Owner A (`auth.uid() = aaaa...`).
2. `select * from T` → assert every returned row has organization_id = Org A (or, for tables without organization_id like order_items, join to parent and assert parent.org = Org A). Assert zero rows with Org B ids.
3. `select * from T where id = '<b-row-id>'` → assert empty result (not an error, not the row).
4. `update T set ... where id = '<b-row-id>'` → assert 0 rows affected (RLS filters it out).
5. `delete from T where id = '<b-row-id>'` → assert 0 rows affected.
6. `insert into T (organization_id=Org B, ...)` as Owner A → assert rejected by RLS (policy requires org match) OR inserted with org forced to A depending on policy. Document chosen behavior: **reject** (policy `organization_id = (select organization_id from users where id = auth.uid())` should reject mismatched org inserts).

Repeat with Owner B symmetrically.

## Tables and specific assertions

### customers
- Owner A `select` → only `c-a`; `c-b` not visible.
- Owner A `select where id='c-b'` → empty.
- Owner A `insert (org=Org B)` → error/0 rows.

### conversations
- conversation `conv-b` (org B) not visible to A; `select where id='conv-b'` empty.

### messages
- message `msg-b` not visible to A. Additionally assert no leak via join: `select m.* from messages m join conversations c on c.id=m.conversation_id where c.organization_id=Org B` returns empty for A (RLS on messages alone already filters, but the join path is a common bypass attempt).

### menu_categories / menu_items
- A cannot read B's menu; A cannot update B's item price; A cannot delete B's category.

### orders / order_items
- A cannot read B's orders or order_items (order_items has no org column — RLS must be via exists (select 1 from orders where orders.id=order_items.order_id and orders.organization_id=...), OR order_items inherits through a view/policy on parent). **Flag:** confirm the migration's RLS policy for order_items uses the parent join; if not, add it. This is a known gap to verify.

### approvals
- A cannot read B's approvals.

### escalations
- A cannot read B's escalations (even urgent ones — no cross-org notification).

### automations
- A cannot read or update B's auto-reply settings (critical: prevents A from disabling B's bot or changing B's persona).

### audit_log
- A cannot read B's audit log (may contain customer phones / order totals).

### whatsapp_accounts
- A cannot read B's access_token_encrypted (critical secret). Assert the column is not returned even if row somehow visible; RLS should hide the whole row.

### organizations
- Owner A can read their own org row only. Cannot read Org B's name/slug. (Policy: `id = (select organization_id from users where id = auth.uid())`.)

### users
- Owner A can read users in Org A only. Cannot read Owner B's display_name/phone. Cannot update B's role.

## Service-role bypass check (negative control)

- Using service role, `select count(*) from customers where organization_id=Org B` must return ≥1 (proves seed exists and RLS is what hides it, not missing data). Run this once to validate the test itself is meaningful.

## Automated implementation

- Framework: Vitest + `@supabase/supabase-js`. Use a test helper that creates two auth users and returns two clients with sessions.
- File: `starter/tests/rls-cross-org.test.ts` (to be created by Lin/Rigel).
- One test per table per operation (select own, select other by id, update other, delete other, insert mismatched org). ~14 tables × 5 ops = 70 assertions, but group into `describe` blocks.
- Run command: `npm run test:rls` (add script) against a local Supabase instance (supabase start) or a dedicated test project.

## Environment requirements

- Supabase project with RLS enabled (migration `infra/supabase/migrations/0001_init.sql` or equivalent).
- Test runner must use anon key + user JWTs, not service role, for assertions.
- CI: run on PR touching `infra/` or `lib/supabase*`.

## Pass criteria

- 0 cross-org rows returned for any operation.
- Any failure (a single leaked row) is a release blocker.
- If `order_items` lacks a working RLS policy, that is a release blocker until fixed (not a "skip").

## Open items to verify against actual migration

- Confirm `order_items` RLS policy uses parent join.
- Confirm `audit_log.organization_id` is NOT NULL in practice (it is nullable in schema); if nullable rows can be created, they may be invisible to all tenants — decide whether that's intended (system-level audit) and document.
- Confirm service role is never used in request paths except webhook/worker (grep `supabase` client creation).
