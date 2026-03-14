create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms', 'dashboard', 'webhook')),
  title text not null,
  message text not null,
  status text not null check (status in ('unread', 'read')) default 'unread',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notifications_merchant_created_idx
  on public.notifications (merchant_id, created_at desc);

alter table public.notifications enable row level security;
