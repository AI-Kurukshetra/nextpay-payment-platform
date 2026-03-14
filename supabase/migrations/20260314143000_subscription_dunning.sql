alter table if exists public.subscriptions
  add column if not exists dunning_attempts int not null default 0;

alter table if exists public.subscriptions
  add column if not exists canceled_at timestamptz;

create index if not exists subscriptions_merchant_status_next_billing_idx
  on public.subscriptions (merchant_id, status, next_billing_at);
