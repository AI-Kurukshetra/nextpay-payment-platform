create extension if not exists pgcrypto;

create table if not exists public.merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  api_key_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  email text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount bigint not null check (amount > 0),
  currency text not null,
  status text not null,
  risk_score int not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  captured_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  amount bigint not null check (amount > 0),
  status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  amount bigint not null check (amount > 0),
  currency text not null,
  interval text not null check (interval in ('month', 'year')),
  trial_days int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id) on delete cascade,
  status text not null,
  next_billing_at timestamptz not null,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_endpoints (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  url text not null,
  secret text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.webhook_events(id) on delete cascade,
  endpoint_id uuid not null references public.webhook_endpoints(id) on delete cascade,
  status text not null,
  attempt int not null default 0,
  error text,
  next_retry_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_alerts (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references public.payments(id) on delete cascade,
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  severity text not null,
  reason text not null,
  created_at timestamptz not null default now()
);

alter table public.merchants enable row level security;
alter table public.customers enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.subscription_plans enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_endpoints enable row level security;
alter table public.webhook_events enable row level security;
alter table public.webhook_deliveries enable row level security;
alter table public.fraud_alerts enable row level security;
