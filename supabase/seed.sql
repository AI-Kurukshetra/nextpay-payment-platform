-- NextPay seed data
-- Seed API key for dashboard and testing:
-- np_live_seed_demo_key_123

insert into public.merchants (id, name, email, api_key_hash)
values
  (
    '11111111-1111-1111-1111-111111111111',
    'Acme Payments',
    'merchant@nextpay.dev',
    'ec7fbea803dbc35b8468b23cbbcf93074ffcf298ecac107593edf48d95a70d76'
  )
on conflict (id) do nothing;

insert into public.customers (id, merchant_id, name, email)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Horizon Foods', 'finance@horizonfoods.in'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Skylab Fitness', 'hello@skylabfit.co'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Acme Logistics', 'billing@acme-logistics.com')
on conflict (id) do nothing;

insert into public.payments (id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, captured_at, idempotency_key)
values
  (
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    120000,
    'USD',
    'succeeded',
    12,
    '{"source":"seed","channel":"api"}'::jsonb,
    now() - interval '2 day',
    'seed-pay-1'
  ),
  (
    '33333333-3333-3333-3333-333333333332',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    450000,
    'INR',
    'authorized',
    24,
    '{"source":"seed","channel":"checkout"}'::jsonb,
    null,
    'seed-pay-2'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222223',
    9900,
    'USD',
    'failed',
    91,
    '{"source":"seed","channel":"api"}'::jsonb,
    null,
    'seed-pay-3'
  )
on conflict (id) do nothing;

insert into public.refunds (id, payment_id, merchant_id, amount, status, reason)
values
  (
    '44444444-4444-4444-4444-444444444441',
    '33333333-3333-3333-3333-333333333331',
    '11111111-1111-1111-1111-111111111111',
    20000,
    'succeeded',
    'partial_refund'
  )
on conflict (id) do nothing;

insert into public.subscription_plans (id, merchant_id, name, amount, currency, interval, trial_days)
values
  ('55555555-5555-5555-5555-555555555551', '11111111-1111-1111-1111-111111111111', 'Starter', 900, 'USD', 'month', 7),
  ('55555555-5555-5555-5555-555555555552', '11111111-1111-1111-1111-111111111111', 'Growth', 2900, 'USD', 'month', 14)
on conflict (id) do nothing;

insert into public.subscriptions (id, merchant_id, customer_id, plan_id, status, next_billing_at, trial_ends_at)
values
  (
    '66666666-6666-6666-6666-666666666661',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222221',
    '55555555-5555-5555-5555-555555555551',
    'active',
    now() + interval '30 day',
    null
  ),
  (
    '66666666-6666-6666-6666-666666666662',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555552',
    'trialing',
    now() + interval '10 day',
    now() + interval '10 day'
  )
on conflict (id) do nothing;

insert into public.webhook_endpoints (id, merchant_id, url, secret, is_active)
values
  (
    '77777777-7777-7777-7777-777777777771',
    '11111111-1111-1111-1111-111111111111',
    'https://merchant.example.com/webhooks',
    'whsec_seed_demo_123',
    true
  )
on conflict (id) do nothing;

insert into public.webhook_events (id, merchant_id, type, payload)
values
  (
    '88888888-8888-8888-8888-888888888881',
    '11111111-1111-1111-1111-111111111111',
    'payment.succeeded',
    '{"paymentId":"33333333-3333-3333-3333-333333333331"}'::jsonb
  ),
  (
    '88888888-8888-8888-8888-888888888882',
    '11111111-1111-1111-1111-111111111111',
    'refund.processed',
    '{"refundId":"44444444-4444-4444-4444-444444444441"}'::jsonb
  )
on conflict (id) do nothing;

insert into public.webhook_deliveries (id, event_id, endpoint_id, status, attempt, error, next_retry_at)
values
  (
    '99999999-9999-9999-9999-999999999991',
    '88888888-8888-8888-8888-888888888881',
    '77777777-7777-7777-7777-777777777771',
    'delivered',
    1,
    null,
    null
  ),
  (
    '99999999-9999-9999-9999-999999999992',
    '88888888-8888-8888-8888-888888888882',
    '77777777-7777-7777-7777-777777777771',
    'failed',
    2,
    'timeout',
    now() + interval '15 minute'
  )
on conflict (id) do nothing;

insert into public.fraud_alerts (id, payment_id, merchant_id, severity, reason)
values
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1',
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'high',
    'high_amount,odd_amount_pattern'
  )
on conflict (id) do nothing;
