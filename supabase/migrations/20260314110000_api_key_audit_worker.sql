create table if not exists public.merchant_api_keys (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  key_last4 text not null,
  label text,
  status text not null default 'active' check (status in ('active', 'revoked')),
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.api_audit_logs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  action text not null,
  actor text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists merchant_api_keys_merchant_status_idx
on public.merchant_api_keys (merchant_id, status, created_at desc);

create index if not exists api_audit_logs_merchant_created_idx
on public.api_audit_logs (merchant_id, created_at desc);

insert into public.merchant_api_keys (merchant_id, key_hash, key_prefix, key_last4, label, status)
select m.id, m.api_key_hash, 'legacy_key', right(m.api_key_hash, 4), 'legacy', 'active'
from public.merchants m
where not exists (
  select 1
  from public.merchant_api_keys k
  where k.merchant_id = m.id
    and k.status = 'active'
);

alter table public.merchant_api_keys enable row level security;
alter table public.api_audit_logs enable row level security;
