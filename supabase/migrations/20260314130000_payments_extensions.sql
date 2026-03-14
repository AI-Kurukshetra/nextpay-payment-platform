create table if not exists public.payment_methods (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text not null,
  brand text not null,
  last4 text not null,
  exp_month int not null,
  exp_year int not null,
  token text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount bigint not null check (amount > 0),
  currency text not null,
  status text not null check (status in ('draft', 'open', 'paid', 'void')),
  due_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  amount bigint not null check (amount > 0),
  currency text not null,
  status text not null check (status in ('pending', 'processing', 'completed', 'failed')),
  scheduled_at timestamptz not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists payment_methods_merchant_created_idx on public.payment_methods (merchant_id, created_at desc);
create index if not exists invoices_merchant_created_idx on public.invoices (merchant_id, created_at desc);
create index if not exists settlements_merchant_scheduled_idx on public.settlements (merchant_id, status, scheduled_at);

alter table public.payment_methods enable row level security;
alter table public.invoices enable row level security;
alter table public.settlements enable row level security;
