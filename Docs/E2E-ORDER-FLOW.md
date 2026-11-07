# E2E Order Flow Test Plan

Owner: Rigel. Scope: full happy path + failure modes for the WhatsApp → draft → owner approval → customer confirmation loop. Source of truth: `PLAN.md` §8, `ARCHITECTURE.md` §2/§3/§5.

## Preconditions

- Org `e2e-org` seeded with menu (same as eval seed) and one owner user `owner@e2e.test`.
- A real or simulated WhatsApp number able to receive/send. For CI, use Evolution API in a container with a test instance; for manual, use the founder's own test number.
- Env: `WHATSAPP_PROVIDER=evolution`, `EVOLUTION_BASE_URL`, `EVOLUTION_API_KEY`, `EVOLUTION_INSTANCE=e2e-instance`, `EVOLUTION_WEBHOOK_TOKEN`.
- Empty DB for `e2e-org` (no customers/conversations/orders) at start of each run. Reset helper: `DELETE FROM ... WHERE organization_id = e2e-org` in FK order (order_items → orders → approvals → messages → conversations → customers → escalations).

## Happy path (HP-1)

**Step 1 — Customer asks price.**
- Action: send WhatsApp message from customer phone `+201111111111`: "كم سعر 2 لاتيه و كرواسون؟"
- Assert webhook: `POST /api/whatsapp/webhook` returns 200 `{received:1}` within 2s; `messages` has one row direction=in, type=text, content matches.
- Assert customer upserted: `customers` row with phone `201111111111` (no @ suffix) and organization_id=e2e-org.
- Assert conversation upserted: `conversations` row status=bot, unread_count>=1.
- Assert Inngest job `whatsapp/message.received` enqueued (check Inngest dashboard or job log).

**Step 2 — Agent quotes from DB.**
- Wait up to 15s for the assistant reply to arrive on the customer phone.
- Assert assistant message persisted: `messages` row direction=out, sender_type=bot, content contains "45" and "30" and a total of "120".
- Assert tool call log (agent trace) shows `getPrice` invoked with both item ids in the same turn. If no tool call → FAIL (memory reliance).
- Assert no `orders` row created yet.

**Step 3 — Customer places order.**
- Action: customer replies "نعم، اطلب".
- Assert agent calls `createOrderDraft({items:[{m-latte,2},{m-croissant,1}]})`.
- Assert `orders` row: status=`draft_pending_owner`, total=120.00, currency=EGP, customer_id matches.
- Assert `order_items`: 2 rows with name_snapshot "Latte"/"Croissant", price_snapshot 45.00/30.00, qty 2/1, subtotal 90.00/30.00.
- Assert `approvals` row: decision IS NULL, requested_at set.
- Assert owner notification: WhatsApp message sent to owner phone containing order id + total + "approve" prompt; OR Supabase Realtime event on `orders` channel received by dashboard. Check at least one.

**Step 4 — Owner approves.**
- Action: dashboard → Orders → open draft → click "Approve" (or `POST /api/orders/[id]/approve` with owner JWT).
- Assert `orders.status` = `confirmed`, `updated_at` > created_at.
- Assert `approvals.decision` = `approved`, `decided_by` = owner user id, `decided_at` set.
- Assert `audit_log` row: actor_type=user, action=order_approved, target_type=order, target_id=order id.
- Assert customer receives confirmation WhatsApp message within 10s containing "confirmed" / "تم التأكيد" and the total.

**Step 5 — Customer follow-up status.**
- Action: customer sends "ما حالة طلبي؟".
- Assert agent calls `getOrderStatus({orderId})` and replies with status "confirmed" (not "draft").

## Assertions summary (automated where possible)

| # | Check | How |
|---|---|---|
| A1 | Webhook 200 + received count | HTTP response body |
| A2 | Idempotency on replay | Re-POST same payload → `received:0`, no duplicate messages |
| A3 | Customer/conversation/message rows | SQL queries |
| A4 | Tool call present in agent trace | Inngest step output / logged JSON |
| A5 | Quoted price matches DB | string contains + DB lookup |
| A6 | Order draft status + total + items | SQL |
| A7 | Approval row + audit log | SQL |
| A8 | Owner notification delivered | WhatsApp send log or Realtime event |
| A9 | Customer confirmation delivered | WhatsApp receive on test phone (manual) or send log |
| A10 | Status follow-up reflects confirmed | SQL + message content |

## Failure modes (must be tested; each must not corrupt data)

**FM-1 — Duplicate webhook delivery.**
- Replay the same Evolution payload twice within 1s.
- Assert: only one `messages` row (whatsapp_message_id unique), only one Inngest job effectively processed (job may run twice but second must be no-op on conflict), no duplicate order, no duplicate reply sent.
- Pass if `received` second = 0 and message count unchanged.

**FM-2 — Owner rejects order.**
- Step 3 creates draft; owner clicks "Reject" with reason "out of stock".
- Assert: `orders.status` = `rejected`, `approvals.decision` = `rejected`, `approvals.note` = reason.
- Assert: customer receives rejection message (polite) within 10s.
- Assert: no payment link sent, no "confirmed" message.

**FM-3 — Owner edits quantity then approves.**
- Owner opens draft, changes latte qty from 2 to 1, saves, approves.
- Assert: `order_items.qty` updated to 1, `orders.total` recalculated = 45+30 = 75 (not 120). Price snapshot unchanged (still 45/30).
- Assert: customer confirmation shows updated total 75.

**FM-4 — Agent cannot confirm without approval.**
- Even if customer says "confirm my order" after a draft, agent must not set status to confirmed; only owner approval does.
- Assert: `orders.status` remains `draft_pending_owner` until owner action.

**FM-5 — Webhook with bad token.**
- POST with wrong `apikey` header.
- Assert: 401, no rows inserted, no job enqueued.

**FM-6 — Webhook from unknown instance.**
- Payload with instance name not in `whatsapp_accounts`.
- Assert: 200 (do not leak) OR 404 per chosen contract; no customer/conversation created; log warning. Document which behavior is chosen (recommend: 200 + drop + warn, to avoid retries storm; but record in runbook).

**FM-7 — Inngest job failure + retry.**
- Simulate DB error mid-job (e.g. kill Supabase connection) on first attempt.
- Assert: Inngest retries per configured policy; on success, exactly one reply sent (idempotency on message id prevents duplicate sends on retry). Verify by counting `messages` direction=out for the conversation = 1.

**FM-8 — Outside business hours.**
- Set business hours 09:00–21:00 Cairo; send at 23:30 Cairo.
- Assert: away message sent, escalation row reason=outside_hours, no order created even if customer asks to order.

**FM-9 — Urgent keyword during order.**
- Customer sends "complaint: cold food" instead of order confirmation.
- Assert: escalation reason=urgent_keyword (or complaint), owner notified within 5s, no order created from that message.

**FM-10 — Auto-reply toggle off mid-flow.**
- Create draft (step 3 done). Toggle auto_reply_enabled=false. Customer sends another message.
- Assert: agent does not reply with menu/order; escalation reason=auto_reply_off; existing draft untouched.

## Manual vs automated split

- Automated (Vitest + Supabase test DB): FM-1, FM-2, FM-3, FM-4, FM-5, webhook assertions A1–A7, status follow-up.
- Manual (real WhatsApp test number): Step 5 confirmation delivery (A9), owner notification (A8) unless a send-log assertion is available, voice-note paths.
- Semi-automated: business-hours/urgent by mocking clock and keywords.

## Pass criteria for release

All HP-1 assertions A1–A10 pass on 3 consecutive runs; all FM-1..FM-10 pass at least once. Any data-corruption failure (duplicate order, wrong total, cross-org leak) is a release blocker regardless of count.
