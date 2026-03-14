create table if not exists public.merchant_payment_preferences (
  merchant_id uuid primary key references public.merchants(id) on delete cascade,
  allow_card boolean not null default true,
  allow_bank boolean not null default true,
  allow_crypto boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint merchant_payment_preferences_one_enabled check (allow_card or allow_bank or allow_crypto)
);

create index if not exists idx_merchant_payment_preferences_updated_at
  on public.merchant_payment_preferences (updated_at desc);

alter table public.merchant_payment_preferences enable row level security;
