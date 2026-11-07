# Architecture & Data Model

Stack: NestJS (backend) + Next.js (frontend) + Supabase Postgres/Auth/RLS/Realtime/Storage + Evolution API + OpenAI + BullMQ/Redis.

## 1. Monorepo layout

```
Agent for whatsapp/
├── backend/          # NestJS
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── organizations/
│   │   │   ├── whatsapp/      # provider abstraction + webhook + sender
│   │   │   ├── ai/            # OpenAI agent + tools
│   │   │   ├── conversations/
│   │   │   ├── menu/
│   │   │   ├── orders/
│   │   │   ├── customers/
│   │   │   ├── automations/
│   │   │   ├── analytics/
│   │   │   └── notifications/
│   │   ├── common/            # guards, interceptors, filters
│   │   └── main.ts
│   └── Dockerfile
├── frontend/         # Next.js 15
├── infra/            # docker-compose, env
└── Docs/
```

## 2. WhatsApp provider abstraction (backend/src/modules/whatsapp)

```ts
interface WhatsAppProvider {
  verifyWebhook(req: Request, rawBody: string): boolean;
  parseWebhook(rawBody: string): NormalizedMessage[];
  sendText(to: string, body: string): Promise<{ messageId: string }>;
  sendList(to: string, list: ListPayload): Promise<{ messageId: string }>;
  health(): Promise<{ connected: boolean; state: string }>;
}
```

Implementations: `EvolutionProvider` (default) and `MetaProvider` (later). Selected by `WHATSAPP_PROVIDER` env.

## 3. Webhook flow (Evolution)

1. Evolution POSTs to `POST /webhooks/whatsapp` with header `apikey: <EVOLUTION_WEBHOOK_TOKEN>`.
2. NestJS controller verifies token; reject 401 on mismatch.
3. Parse `messages.upsert` events; skip `fromMe`; skip groups in MVP.
4. Idempotency: `INSERT INTO messages (whatsapp_message_id) ... ON CONFLICT DO NOTHING`; if 0 rows, skip.
5. Resolve org by `instance` name → `whatsapp_accounts`.
6. Upsert customer by `(org, phone)`; upsert conversation.
7. Enqueue BullMQ job `process-message` with `{organizationId, conversationId, messageId}`.
8. Return 200 immediately.

Evolution webhook payload (normalized fields): `data.key.remoteJid`, `data.key.id`, `data.key.fromMe`, `data.pushName`, `data.message.conversation | extendedTextMessage.text`, `data.messageTimestamp`.

## 4. Processing job (BullMQ worker)

```
load org settings (automations) + conversation history (last 20)
if !auto_reply_enabled -> create escalation('auto_reply_off'); notify owner; return
if outside business hours and not urgent -> send away_message; escalate; return
if message matches urgent keywords -> escalate('urgent_keyword'); (may still reply with ack)
run OpenAI agent:
  system prompt includes org persona (AR/EN), menu categories, rules
  tools: getMenu, getPrice, createOrderDraft, getOrderStatus, escalateToOwner
  model: gpt-4o-mini for chat (cost), gpt-4o for vision (menu photos)
  maxSteps = 6
send reply via provider.sendText/sendList
persist assistant message
if order draft created -> create approval row + notify owner (WhatsApp + Supabase Realtime)
```

## 5. OpenAI agent tools (Lin owns; prices only from DB)

- `getMenu({category?})` → available items grouped by category.
- `getPrice({itemIds[]})` → price + availability.
- `createOrderDraft({customerId, items, notes})` → order status `draft_pending_owner`, returns orderId + total.
- `getOrderStatus({orderId})` → status for follow-ups.
- `escalateToOwner({reason, summary})` → escalation row + owner notification; agent tells customer owner will reply.

System prompt rule: "Never state a price or availability unless you called getPrice/getMenu in this turn." Prices formatted with org currency (default EGP).

## 6. Database schema (Supabase Postgres)

```sql
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  timezone text not null default 'Africa/Cairo',
  currency text not null default 'EGP',
  locale text not null default 'ar',   -- 'ar' | 'en' | 'bilingual'
  created_at timestamptz default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  role text not null check (role in ('owner','staff')),
  display_name text,
  phone text,
  notify_whatsapp boolean default true,
  push_token text,
  created_at timestamptz default now()
);

create table whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  provider text not null default 'evolution' check (provider in ('evolution','meta')),
  instance_name text,                  -- evolution instance
  phone_number_id text,                -- meta
  access_token_encrypted text,
  status text not null default 'pending' check (status in ('pending','connected','disconnected')),
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  phone text not null,
  name text,
  language text default 'auto',
  tags text[] default '{}',
  notes text,
  created_at timestamptz default now(),
  unique (organization_id, phone)
);

create table conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  customer_id uuid not null references customers(id),
  status text not null default 'bot' check (status in ('bot','human','closed')),
  assigned_user_id uuid references users(id),
  last_message_at timestamptz,
  unread_count int default 0,
  created_at timestamptz default now()
);

create table messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  conversation_id uuid not null references conversations(id),
  whatsapp_message_id text unique,
  direction text not null check (direction in ('in','out')),
  sender_type text not null check (sender_type in ('customer','bot','agent','owner')),
  type text not null default 'text',
  content text,
  media_url text,
  status text default 'sent',
  created_at timestamptz default now()
);

create table menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name_ar text,
  name_en text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  category_id uuid references menu_categories(id),
  name_ar text,
  name_en text not null,
  description_ar text,
  description_en text,
  price numeric(12,2) not null,
  currency text not null,
  image_url text,
  available boolean default true,
  sku text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  customer_id uuid not null references customers(id),
  conversation_id uuid references conversations(id),
  status text not null default 'draft_pending_owner'
     check (status in ('draft_pending_owner','confirmed','preparing','ready','delivered','cancelled','rejected')),
  total numeric(12,2) not null default 0,
  currency text not null,
  notes text,
  payment_status text default 'unpaid' check (payment_status in ('unpaid','paid','refunded')),
  payment_link text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name_snapshot text not null,
  price_snapshot numeric(12,2) not null,
  qty int not null check (qty > 0),
  subtotal numeric(12,2) not null
);

create table approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  order_id uuid not null references orders(id),
  requested_at timestamptz default now(),
  decided_by uuid references users(id),
  decision text check (decision in ('approved','rejected','edited')),
  decided_at timestamptz,
  note text
);

create table escalations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  conversation_id uuid references conversations(id),
  customer_id uuid references customers(id),
  reason text not null,
  summary text,
  status text default 'open' check (status in ('open','resolved')),
  resolved_by uuid references users(id),
  resolved_at timestamptz,
  created_at timestamptz default now()
);

create table automations (
  organization_id uuid primary key references organizations(id),
  auto_reply_enabled boolean default false,
  business_hours jsonb,
  urgent_keywords text[] default '{}',
  away_message text,
  persona_prompt text,
  updated_at timestamptz default now()
);

create table audit_log (
  id bigserial primary key,
  organization_id uuid references organizations(id),
  actor_type text not null,
  actor_id text,
  action text not null,
  target_type text,
  target_id text,
  meta jsonb,
  created_at timestamptz default now()
);
```

RLS: enable on all tables; policy `organization_id = (select organization_id from users where id = auth.uid())`. Service role used only in webhook/worker (always filter by org).

## 7. NestJS modules & routes

- `POST /webhooks/whatsapp` — Evolution delivery.
- `POST /webhooks/whatsapp/meta` — (future) Meta delivery.
- Auth: Supabase JWT guard (`Authorization: Bearer`).
- `GET/POST /menu`, `GET/POST /orders`, `POST /orders/:id/approve|reject`, `GET /conversations`, `GET /conversations/:id/messages`, `POST /conversations/:id/takeover`, `GET /customers`, `GET/PUT /automations`, `GET /analytics/*`, `GET /health/whatsapp`.

## 8. Frontend (Next.js 15)

- App Router, Supabase SSR auth, React Query for data, Supabase Realtime for inbox/orders.
- Routes: `/dashboard`, `/dashboard/inbox`, `/dashboard/orders`, `/dashboard/menu`, `/dashboard/customers`, `/dashboard/automations`, `/dashboard/analytics`, `/dashboard/settings`.
- RTL support for Arabic via `dir` attribute + Tailwind logical properties.

## 9. Infra (Docker Compose)

Services: `backend` (NestJS), `frontend` (Next.js), `evolution-api`, `postgres` (or Supabase cloud), `redis`. For portfolio demo, use Supabase cloud (free tier) to simplify; self-host Postgres only if needed.

## 10. Observability

- Sentry (backend + frontend).
- PostHog (product events).
- BullMQ dashboard (bull-board) for job health.
- Log LLM token usage per org in `audit_log` meta.