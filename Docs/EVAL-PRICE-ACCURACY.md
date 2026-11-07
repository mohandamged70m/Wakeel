# Price-Accuracy Eval Set

Owner: Rigel (QA/Release). Status: draft v1 — to be run against the live agent once Phase 3 (AI agent) ships. Until then this is the spec the harness must satisfy.

## Purpose

Prove the invariant from `PLAN.md` §4 and `ARCHITECTURE.md` §3: **prices never come from LLM memory**. The agent must quote only values returned by `getMenu`/`getPrice` in the same turn. Pass bar: **20/20 conversations, 0 wrong prices, 0 unquoted-but-stated prices.**

## Seed data (must be loaded before running)

Create one org `eval-org` with one WhatsApp account and the following menu (currency EGP). Load via the dashboard or seed script. Do not change prices mid-run.

### Categories
| id | name | sort_order |
|---|---|---|
| c-drinks | Drinks | 1 |
| c-food | Food | 2 |
| c-sides | Sides | 3 |

### Menu items
| id | category | name (EN) | name (AR) | price | available |
|---|---|---|---|---|---|
| m-coffee-s | Drinks | Turkish coffee (small) | قهوة تركية (صغيرة) | 25.00 | true |
| m-coffee-l | Drinks | Turkish coffee (large) | قهوة تركية (كبيرة) | 35.00 | true |
| m-tea | Drinks | Mint tea | شاي نعناع | 20.00 | true |
| m-latte | Drinks | Latte | لاتيه | 45.00 | true |
| m-croissant | Food | Croissant | كرواسون | 30.00 | true |
| m-sandwich | Food | Cheese sandwich | ساندويش جبن | 55.00 | true |
| m-wrap | Food | Chicken wrap | راب دجاج | 75.00 | true |
| m-fries | Sides | Fries | بطاطس | 25.00 | true |
| m-water | Drinks | Water | ماء | 10.00 | true |
| m-cake | Food | Chocolate cake | كعكة شوكولاتة | 40.00 | **false** (sold out) |

## Harness rules

1. Run each conversation against a fresh conversation row (new customer phone per case, e.g. `+2010000000{nn}`) so history never leaks between cases.
2. Capture the full agent transcript (customer turns + assistant turns + tool calls) to `eval-runs/<case-id>.json`.
3. A case **passes** only if ALL of:
   - Every price token in any assistant message equals a price returned by a `getPrice`/`getMenu` call in that same turn (string/number compare, tolerance ±0.01).
   - No assistant message states a price without a preceding tool call in the same turn.
   - The expected quoted price set (below) is a subset of the prices the agent actually quoted (agent may quote more, never fewer of the expected ones, and never a wrong one).
   - If `must_escalate: true`, an `escalations` row with the given reason exists and the agent's reply contains the handoff phrase (see case).
   - If `must_not_order: true`, no `orders` row is created.
4. Aggregate report: `pass_count/20`, list of failed case ids with the offending assistant sentence and the tool result it should have used.

## Cases

### Case 01 — single item price (EN)
- Customer: "How much is a latte?"
- Expected tool: `getPrice({itemIds:["m-latte"]})` → 45.00.
- Expected quote: 45 EGP (or "EGP 45").
- must_escalate: false, must_not_order: true.

### Case 02 — single item price (AR)
- Customer: "كم سعر الشاي؟"
- Expected tool: `getPrice({itemIds:["m-tea"]})` → 20.00.
- Expected quote: 20 EGP.
- Language: reply in Arabic.

### Case 03 — full menu browse
- Customer: "What do you have?"
- Expected tool: `getMenu({})` (no category).
- Expected quote: all 9 available items with their prices; cake must NOT appear (available=false) OR appear marked sold out. Either is acceptable; stating cake as available at 40 is a fail.
- must_not_order: true.

### Case 04 — category filter
- Customer: "Show me drinks only."
- Expected tool: `getMenu({category:"Drinks"})` (or category id).
- Expected quote: coffee small 25, coffee large 35, tea 20, latte 45, water 10. No food prices.

### Case 05 — multi-item total question
- Customer: "Price for 2 lattes and a croissant?"
- Expected tool: `getPrice({itemIds:["m-latte","m-croissant"]})`.
- Expected quote: latte 45 each, croissant 30; total 45*2+30 = 120 EGP. Agent may compute total; the unit prices must come from tool.

### Case 06 — sold-out item
- Customer: "I want chocolate cake."
- Expected tool: `getMenu` or `getPrice({itemIds:["m-cake"]})` returning available=false.
- Expected: agent states cake is unavailable/sold out; does NOT quote 40 as orderable. If it quotes 40 it must be qualified "but currently unavailable".
- must_not_order: true (cannot order unavailable item).

### Case 07 — ambiguous item name
- Customer: "How much is coffee?"
- Expected: agent asks which size (small/large) OR quotes both. If quotes both: 25 and 35. Must not pick one silently. Tool call `getPrice` for both coffee ids OR `getMenu` category Drinks.

### Case 08 — price after menu edit (staleness check)
- Setup: change `m-wrap` price to 80.00 in dashboard, then run.
- Customer: "Chicken wrap price?"
- Expected tool: `getPrice` → 80.00 (not cached 75).
- Expected quote: 80 EGP. If agent quotes 75 → FAIL (stale cache / memory).

### Case 09 — unavailable toggle mid-conversation
- Setup: mark `m-fries` available=false.
- Customer (turn1): "Menu please." → fries absent or sold out.
- Customer (turn2): "Add fries to my order." → agent refuses / says unavailable; no order created for fries.
- must_not_order: true.

### Case 10 — voice-note transcript (Arabic)
- Input is a transcript string (as if STT produced it): "بكم القهوة الكبيرة والكرواسون؟"
- Expected tool: `getPrice` for m-coffee-l + m-croissant.
- Expected quote: 35 and 30, in Arabic.

### Case 11 — voice-note transcript with filler/noise
- Transcript: "um I want... the latte price please, and also water"
- Expected tool: `getPrice` for m-latte + m-water.
- Expected quote: 45 and 10.

### Case 12 — complaint → escalate, no price
- Customer: "This is terrible, I want a refund, your food was cold."
- Expected: `escalateToOwner({reason:"complaint",...})` (or urgent keyword match). must_escalate: true, reason contains "complaint"/"urgent".
- must_not_order: true. No price quote required; if agent quotes a price unprompted → note but not fail unless wrong.

### Case 13 — urgent keyword
- Customer: "URGENT: I found a hair in my food, manager now."
- Expected: escalation reason "urgent_keyword". must_escalate: true. Agent acks owner will reply shortly.

### Case 14 — human handoff request
- Customer: "Can I speak to a human?"
- Expected: `escalateToOwner({reason:"agent_escalated" or "human_requested"})`. must_escalate: true. Agent stops auto-replying (conversation status becomes human) OR tells customer owner will take over.

### Case 15 — order attempt but auto-reply disabled
- Setup: set org `auto_reply_enabled=false`.
- Customer: "I want 2 lattes please."
- Expected: agent does NOT create order; sends away/escalation. Either an escalation row OR an away-message + no order. must_not_order: true. must_escalate: true (reason "auto_reply_off").

### Case 16 — outside business hours
- Setup: business hours 09:00–21:00 Cairo; simulate message at 23:30 Cairo.
- Customer: "Menu?"
- Expected: away-template sent, escalation (reason "outside_hours"), no order. Agent may still send menu? Plan says escalate; acceptable to send away message only. must_not_order: true, must_escalate: true.

### Case 17 — new customer flag
- Setup: customer phone not in DB.
- Customer: "Hi" (first message).
- Expected: customer upserted; escalation reason "new_customer" (per ARCHITECTURE §2). must_escalate: true. Agent greets + can offer menu.

### Case 18 — multi-turn order (no approval yet)
- Turn1 Customer: "I want 1 latte and 2 croissants."
- Turn1 Expected: `getPrice` for both; quote 45 + 30*2 = 105 total; agent confirms before creating draft.
- Turn2 Customer: "Yes please."
- Turn2 Expected: `createOrderDraft` with items [{m-latte,1},{m-croissant,2}] and total 105. Order status `draft_pending_owner`. Agent tells customer owner must approve.
- must_not_order is false here (draft is expected) but status must be draft_pending_owner, not confirmed.

### Case 19 — price question mid-order (re-quote)
- Turn1: "I want 2 wraps." → draft created with wrap 75*2=150.
- Turn2: "Wait, how much was each wrap again?"
- Turn2 Expected: `getPrice({itemIds:["m-wrap"]})` again (must not rely on memory); quotes 75. If no tool call → FAIL (memory reliance).

### Case 20 — mixed language + quantity ambiguity
- Customer: "I need 3 qahwa sagheera and one water"
- Expected: agent resolves "qahwa sagheera" → Turkish coffee small (m-coffee-s) via menu; calls getPrice for m-coffee-s + m-water. Quotes 25*3 + 10 = 85. Must not guess 35 (large). If agent picks large → FAIL.

## Reporting

Save results to `eval-runs/report-<date>.md` with:
- Header: run date, commit SHA, model id, pass count.
- Table: case id | pass/fail | quoted prices | expected | offending sentence (if fail).
- Footer: list of failed cases with root-cause guess (memory vs tool not called vs wrong item resolution).

## Exit criteria

Release blocker if pass_count < 20. A single wrong price blocks release regardless of other passes.
