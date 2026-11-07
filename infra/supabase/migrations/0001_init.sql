-- Initial schema for WhatsApp Order SaaS
-- Run against a fresh Supabase project (SQL editor or supabase db push).

create extension if not exists "uuid-ossp";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  timezone text not null default 'Africa/Cairo',
  currency text not null default 'EGP',
  locale text not null default 'ar',
  created_at timestamptz default now()
);

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  role text not null check (role in ('owner','staff')),
  display_name text,
  phone text,
  notify_whatsapp boolean default true,
  push_token text,
  created_at timestamptz default now()
);

create table if not exists whatsapp_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  provider text not null default 'evolution' check (provider in ('evolution','meta')),
  instance_name text,
  phone_number_id text,
  access_token_encrypted text,
  status text not null default 'pending' check (status in ('pending','connected','disconnected')),
  last_seen_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists customers (
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

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  customer_id uuid not null references customers(id),
  status text not null default 'bot' check (status in ('bot','human','closed')),
  assigned_user_id uuid references users(id),
  last_message_at timestamptz,
  unread_count int default 0,
  created_at timestamptz default now()
);

create table if not exists messages (
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

create table if not exists menu_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  name_ar text,
  name_en text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists menu_items (
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

create table if not exists orders (
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

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  menu_item_id uuid references menu_items(id),
  name_snapshot text not null,
  price_snapshot numeric(12,2) not null,
  qty int not null check (qty > 0),
  subtotal numeric(12,2) not null
);

create table if not exists approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  order_id uuid not null references orders(id),
  requested_at timestamptz default now(),
  decided_by uuid references users(id),
  decision text check (decision in ('approved','rejected','edited')),
  decided_at timestamptz,
  note text
);

create table if not exists escalations (
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

create table if not exists automations (
  organization_id uuid primary key references organizations(id),
  auto_reply_enabled boolean default false,
  business_hours jsonb,
  urgent_keywords text[] default '{}',
  away_message text,
  persona_prompt text,
  updated_at timestamptz default now()
);

create table if not exists audit_log (
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

-- RLS
alter table organizations enable row level security;
alter table users enable row level security;
alter table whatsapp_accounts enable row level security;
alter table customers enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table menu_categories enable row level security;
alter table menu_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table approvals enable row level security;
alter table escalations enable row level security;
alter table automations enable row level security;
alter table audit_log enable row level security;

-- Policy helper: org resolution
create or replace function current_org_id() returns uuid
language sql stable security definer set search_path = public as $$
  select organization_id from users where id = auth.uid()
$$;

-- Generic org-scoped policies
do $$
declare t text;
begin
  for t in select unnest(array[
    'whatsapp_accounts','customers','conversations','messages','menu_categories','menu_items',
    'orders','approvals','escalations','automations','audit_log'
  ]) loop
    execute format('create policy %I_org_select on %I for select using (organization_id = current_org_id())', t, t);
    execute format('create policy %I_org_modify on %I for all using (organization_id = current_org_id()) with check (organization_id = current_org_id())', t, t);
  end loop;
end $$;

-- organizations: members can read their own org
create policy organizations_select on organizations for select
  using (id = current_org_id());

-- users: members can read users in their org
create policy users_select on users for select
  using (organization_id = current_org_id());

-- order_items: scoped via order -> org
create policy order_items_select on order_items for select
  using (exists (select 1 from orders o where o.id = order_items.order_id and o.organization_id = current_org_id()));
create policy order_items_modify on order_items for all
  using (exists (select 1 from orders o where o.id = order_items.order_id and o.organization_id = current_org_id()))
  with check (exists (select 1 from orders o where o.id = order_items.order_id and o.organization_id = current_org_id()));

-- service role bypasses RLS automatically in Supabase.
