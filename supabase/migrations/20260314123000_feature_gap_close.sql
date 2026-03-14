alter table if exists public.webhook_endpoints
  add column if not exists verified_at timestamptz;

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  reason text not null,
  amount bigint not null check (amount > 0),
  status text not null check (status in ('open', 'under_review', 'won', 'lost')),
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_links (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  token text not null unique,
  amount bigint not null check (amount > 0),
  currency text not null,
  description text,
  is_active boolean not null default true,
  expires_at timestamptz,
  max_uses int,
  use_count int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fraud_rules (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  min_amount bigint,
  max_amount bigint,
  currency text,
  risk_score_increment int not null check (risk_score_increment > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists disputes_merchant_created_idx on public.disputes (merchant_id, created_at desc);
create index if not exists payment_links_merchant_created_idx on public.payment_links (merchant_id, created_at desc);
create index if not exists fraud_rules_merchant_active_idx on public.fraud_rules (merchant_id, is_active, created_at desc);

alter table public.disputes enable row level security;
alter table public.payment_links enable row level security;
alter table public.fraud_rules enable row level security;
