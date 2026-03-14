create table if not exists public.sub_merchants (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  email text not null,
  status text not null check (status in ('active', 'suspended')),
  created_at timestamptz not null default now()
);

create table if not exists public.split_transfers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  payment_id uuid not null references public.payments(id) on delete cascade,
  sub_merchant_id uuid not null references public.sub_merchants(id) on delete cascade,
  amount bigint not null check (amount > 0),
  currency text not null,
  status text not null check (status in ('pending', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.wallet_sessions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  amount bigint not null check (amount > 0),
  currency text not null,
  provider text not null check (provider in ('apple_pay', 'google_pay')),
  status text not null check (status in ('created', 'authorized', 'expired')),
  client_secret text not null unique,
  created_at timestamptz not null default now()
);

create index if not exists sub_merchants_merchant_created_idx on public.sub_merchants (merchant_id, created_at desc);
create index if not exists split_transfers_merchant_created_idx on public.split_transfers (merchant_id, created_at desc);
create index if not exists wallet_sessions_merchant_created_idx on public.wallet_sessions (merchant_id, created_at desc);

alter table public.sub_merchants enable row level security;
alter table public.split_transfers enable row level security;
alter table public.wallet_sessions enable row level security;
