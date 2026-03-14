alter table public.payments
add column if not exists idempotency_key text;

create unique index if not exists payments_merchant_idempotency_key_uniq
on public.payments (merchant_id, idempotency_key)
where idempotency_key is not null;

create index if not exists customers_merchant_created_idx
on public.customers (merchant_id, created_at desc);

create unique index if not exists customers_merchant_email_uniq
on public.customers (merchant_id, email);

create index if not exists payments_merchant_created_idx
on public.payments (merchant_id, created_at desc);

create index if not exists payments_merchant_status_created_idx
on public.payments (merchant_id, status, created_at desc);

create index if not exists payments_customer_idx
on public.payments (customer_id)
where customer_id is not null;

create index if not exists refunds_payment_idx
on public.refunds (payment_id, created_at desc);

create index if not exists refunds_merchant_created_idx
on public.refunds (merchant_id, created_at desc);

create index if not exists plans_merchant_created_idx
on public.subscription_plans (merchant_id, created_at desc);

create index if not exists subscriptions_merchant_status_next_billing_idx
on public.subscriptions (merchant_id, status, next_billing_at);

create index if not exists subscriptions_customer_idx
on public.subscriptions (customer_id, created_at desc);

create index if not exists webhook_endpoints_merchant_active_idx
on public.webhook_endpoints (merchant_id, is_active, created_at desc);

create index if not exists webhook_events_merchant_type_created_idx
on public.webhook_events (merchant_id, type, created_at desc);

create index if not exists webhook_deliveries_retry_queue_idx
on public.webhook_deliveries (status, next_retry_at, attempt)
where status <> 'delivered';

create index if not exists webhook_deliveries_endpoint_created_idx
on public.webhook_deliveries (endpoint_id, created_at desc);

create index if not exists fraud_alerts_merchant_created_idx
on public.fraud_alerts (merchant_id, created_at desc);

create index if not exists payments_created_brin
on public.payments using brin (created_at);

create index if not exists webhook_events_created_brin
on public.webhook_events using brin (created_at);
