-- PayForge seed data for client showcase
-- Merchant API keys for testing:
-- 1) np_live_aurelia_demo_2026
-- 2) np_live_bluepine_demo_2026
-- 3) np_live_summitcart_demo_2026

insert into public.merchants (id, name, email, api_key_hash)
values
  (
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'Aurelia Commerce Group',
    'finance@aureliacommerce.com',
    '88a1ae3a2f357d965d63d6b6d6dc194fdf70f5ee79f19e8f5333fd47638dd0db'
  ),
  (
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    'Bluepine Digital Goods',
    'payments@bluepinedigital.com',
    'a109d16e32d909c715f81d58367e18165876b5c46ed5b2c281a8e8082e3d00c8'
  ),
  (
    'c9a1f2e7-2b9d-4fc8-a712-7de84d903f33',
    'SummitCart Lifestyle',
    'billing@summitcart.io',
    'bc9108b0fb916154e836fc5f4a8a747670ff4cd5c279e4807fee009d18fa0646'
  )
on conflict (id) do nothing;

insert into public.customers (id, merchant_id, name, email)
values
  ('1d8a49ea-3e70-4d9a-b6c2-8d1fa7080a11', '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11', 'Emma Brooks', 'emma.brooks@example.com'),
  ('2ab77f30-ecf8-4f52-bbf9-6d6688c16b22', '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11', 'Liam Foster', 'liam.foster@example.com'),
  ('3345a89e-7cb1-4f7f-9d2a-4a0866d0f533', '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11', 'Sophia Reed', 'sophia.reed@example.com'),
  ('4c22d641-8e80-4cea-856f-2f31bc7f7444', 'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22', 'Mason Clarke', 'mason.clarke@example.com'),
  ('5fb30ab2-31a0-4b12-adbc-12cf93d8b555', 'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22', 'Isabella Hayes', 'isabella.hayes@example.com'),
  ('63f2f511-2abc-4c57-97ff-5bb12e14d666', 'c9a1f2e7-2b9d-4fc8-a712-7de84d903f33', 'Ethan Ward', 'ethan.ward@example.com')
on conflict (id) do nothing;

insert into public.payments (id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, captured_at, idempotency_key)
values
  (
    '7a49d4c2-b4b1-4f84-9a87-12d2f0500a01',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '1d8a49ea-3e70-4d9a-b6c2-8d1fa7080a11',
    120000,
    'USD',
    'succeeded',
    12,
    '{"source":"seed","channel":"api","orderId":"AUR-1001","product":"Professional Toolkit","processor":"stripe"}'::jsonb,
    now() - interval '2 day',
    'seed-aurelia-pay-1'
  ),
  (
    '8bcd5e90-406d-4d48-b720-258d41b30a02',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '2ab77f30-ecf8-4f52-bbf9-6d6688c16b22',
    450000,
    'INR',
    'authorized',
    24,
    '{"source":"seed","channel":"checkout","orderId":"AUR-1002","product":"Scale Plan","processor":"razorpay"}'::jsonb,
    null,
    'seed-aurelia-pay-2'
  ),
  (
    '9ef36f70-9222-4afa-bf11-16a9654f0a03',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '3345a89e-7cb1-4f7f-9d2a-4a0866d0f533',
    9900,
    'USD',
    'failed',
    91,
    '{"source":"seed","channel":"api","orderId":"AUR-1003","product":"Premium Add-On","processor":"adyen"}'::jsonb,
    null,
    'seed-aurelia-pay-3'
  ),
  (
    'a3045d12-f9f7-45a9-a0d6-e0c8af680a04',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    '4c22d641-8e80-4cea-856f-2f31bc7f7444',
    64000,
    'EUR',
    'succeeded',
    18,
    '{"source":"seed","channel":"checkout","orderId":"BLP-2001","product":"Design Asset Bundle","processor":"stripe"}'::jsonb,
    now() - interval '1 day',
    'seed-bluepine-pay-1'
  ),
  (
    'b5b5f3c8-6e4e-4b43-9b2f-59a2a7ee0a05',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    '5fb30ab2-31a0-4b12-adbc-12cf93d8b555',
    7200,
    'USD',
    'succeeded',
    9,
    '{"source":"seed","channel":"api","orderId":"BLP-2002","product":"Template License","processor":"stripe"}'::jsonb,
    now() - interval '12 hour',
    'seed-bluepine-pay-2'
  ),
  (
    'c6d7ff32-0ec6-4f31-a6d1-29b3c67d0a06',
    'c9a1f2e7-2b9d-4fc8-a712-7de84d903f33',
    '63f2f511-2abc-4c57-97ff-5bb12e14d666',
    18500,
    'USD',
    'authorized',
    15,
    '{"source":"seed","channel":"checkout","orderId":"SUM-3001","product":"Weekend Gear Pack","processor":"bank_gateway"}'::jsonb,
    null,
    'seed-summitcart-pay-1'
  )
on conflict (id) do nothing;

insert into public.refunds (id, payment_id, merchant_id, amount, status, reason)
values
  (
    'd7176004-f7f5-46b8-acbe-c38cbf5f0a07',
    '7a49d4c2-b4b1-4f84-9a87-12d2f0500a01',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    20000,
    'succeeded',
    'partial_refund'
  )
on conflict (id) do nothing;

insert into public.subscription_plans (id, merchant_id, name, amount, currency, interval, trial_days)
values
  ('e8212f3b-cb7d-4ff3-86a9-98f1cb990a08', '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11', 'Starter Monthly', 900, 'USD', 'month', 7),
  ('f95a11c7-5cd1-4a0e-a428-a9d362d10a09', '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11', 'Growth Monthly', 2900, 'USD', 'month', 14),
  ('1a9dfaf5-4ebd-4b26-a7ef-9553f8de2a10', 'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22', 'Creator Annual', 19900, 'USD', 'year', 14)
on conflict (id) do nothing;

insert into public.subscriptions (id, merchant_id, customer_id, plan_id, status, next_billing_at, trial_ends_at)
values
  (
    '2bc6c7a6-8d9a-44e0-a8dc-b7e3642f6a11',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '1d8a49ea-3e70-4d9a-b6c2-8d1fa7080a11',
    'e8212f3b-cb7d-4ff3-86a9-98f1cb990a08',
    'active',
    now() + interval '30 day',
    null
  ),
  (
    '312c17e8-27ce-4f48-bb4c-24fab9077a12',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '2ab77f30-ecf8-4f52-bbf9-6d6688c16b22',
    'f95a11c7-5cd1-4a0e-a428-a9d362d10a09',
    'trialing',
    now() + interval '10 day',
    now() + interval '10 day'
  ),
  (
    '44fef3a9-94a8-4de2-8a5a-57920f4d8a13',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    '5fb30ab2-31a0-4b12-adbc-12cf93d8b555',
    '1a9dfaf5-4ebd-4b26-a7ef-9553f8de2a10',
    'active',
    now() + interval '365 day',
    null
  )
on conflict (id) do nothing;

insert into public.webhook_endpoints (id, merchant_id, url, secret, is_active)
values
  (
    '53d8ab43-8bf0-4f30-8f20-c9f876a90a14',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'https://hooks.aureliacommerce.com/payments',
    'whsec_aurelia_demo_123',
    true
  ),
  (
    '6e92c6a5-ec19-4ed9-9991-9cfc95ee9a15',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    'https://api.bluepinedigital.com/webhooks/payments',
    'whsec_bluepine_demo_123',
    true
  ),
  (
    '7f4d4a8b-e3d0-4983-bf51-73d3001f6a16',
    'c9a1f2e7-2b9d-4fc8-a712-7de84d903f33',
    'https://events.summitcart.io/webhooks',
    'whsec_summit_demo_123',
    true
  )
on conflict (id) do nothing;

insert into public.webhook_events (id, merchant_id, type, payload)
values
  (
    '84a4db30-c52f-4f66-b263-9df086130a17',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'payment.succeeded',
    '{"paymentId":"7a49d4c2-b4b1-4f84-9a87-12d2f0500a01"}'::jsonb
  ),
  (
    '95c58f72-c0f3-49f9-baa9-ac716d530a18',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'refund.processed',
    '{"refundId":"d7176004-f7f5-46b8-acbe-c38cbf5f0a07"}'::jsonb
  ),
  (
    'a6eab035-2dd1-4f9f-a9a7-66f6f8340a19',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    'payment.succeeded',
    '{"paymentId":"a3045d12-f9f7-45a9-a0d6-e0c8af680a04"}'::jsonb
  )
on conflict (id) do nothing;

insert into public.webhook_deliveries (id, event_id, endpoint_id, status, attempt, error, next_retry_at)
values
  (
    'b7f90c7c-d130-4a03-ad90-b73d9a1f0a20',
    '84a4db30-c52f-4f66-b263-9df086130a17',
    '53d8ab43-8bf0-4f30-8f20-c9f876a90a14',
    'delivered',
    1,
    null,
    null
  ),
  (
    'c8aa4be2-af3c-4330-9960-56a0fb720a21',
    '95c58f72-c0f3-49f9-baa9-ac716d530a18',
    '53d8ab43-8bf0-4f30-8f20-c9f876a90a14',
    'failed',
    2,
    'timeout',
    now() + interval '15 minute'
  ),
  (
    'd9b0e5f7-4c19-46fe-89f8-9a63a8bb0a22',
    'a6eab035-2dd1-4f9f-a9a7-66f6f8340a19',
    '6e92c6a5-ec19-4ed9-9991-9cfc95ee9a15',
    'delivered',
    1,
    null,
    null
  )
on conflict (id) do nothing;

insert into public.fraud_alerts (id, payment_id, merchant_id, severity, reason)
values
  (
    'ea16c6f8-f63f-47fd-a8fc-b5c0eac20a23',
    '9ef36f70-9222-4afa-bf11-16a9654f0a03',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'high',
    'high_amount,odd_amount_pattern'
  )
on conflict (id) do nothing;

insert into public.disputes (id, merchant_id, payment_id, reason, amount, status, evidence)
values
  (
    'fbc8ee80-6f66-4431-b8cb-25dbba6a0a24',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '7a49d4c2-b4b1-4f84-9a87-12d2f0500a01',
    'product_not_received',
    120000,
    'under_review',
    'Courier tracking and signed proof attached.'
  )
on conflict (id) do nothing;

insert into public.payment_links (id, merchant_id, token, amount, currency, description, is_active, expires_at, max_uses, use_count)
values
  (
    '0cd8fd62-d1fa-4526-96ca-9f99f89a0a25',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'aurelia-invoice-1009',
    15900,
    'USD',
    'Invoice #1009 - UX strategy workshop',
    true,
    now() + interval '10 day',
    5,
    1
  ),
  (
    '1df3a6c9-a15a-4ac6-a729-238f3bc00a26',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    'bluepine-license-2042',
    7900,
    'USD',
    'Invoice #2042 - Extended license',
    true,
    now() + interval '7 day',
    10,
    0
  )
on conflict (id) do nothing;

insert into public.fraud_rules (id, merchant_id, name, min_amount, max_amount, currency, risk_score_increment, is_active)
values
  (
    '2e727c6d-b2ff-47b9-bfdf-f23f9d040a27',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'High Value USD Rule',
    100000,
    null,
    'USD',
    20,
    true
  ),
  (
    '3f9d83b4-c2f4-4d2d-9325-1189db900a28',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    'EUR Traffic Guard',
    50000,
    null,
    'EUR',
    15,
    true
  )
on conflict (id) do nothing;

insert into public.payment_methods (id, merchant_id, customer_id, type, brand, last4, exp_month, exp_year, token)
values
  (
    '401cc4f0-6e9e-4c25-9922-0a31b2e10a29',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '1d8a49ea-3e70-4d9a-b6c2-8d1fa7080a11',
    'card',
    'visa',
    '4242',
    12,
    2029,
    'pm_tok_seed_aurelia_4242'
  ),
  (
    '51895e7a-b0eb-4600-a652-1aeb04f40a30',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    '4c22d641-8e80-4cea-856f-2f31bc7f7444',
    'card',
    'mastercard',
    '4444',
    11,
    2028,
    'pm_tok_seed_bluepine_4444'
  )
on conflict (id) do nothing;

insert into public.invoices (id, merchant_id, customer_id, subscription_id, amount, currency, status, due_at)
values
  (
    '62de3ed9-16b5-4f2d-a87e-9bb18f650a31',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '1d8a49ea-3e70-4d9a-b6c2-8d1fa7080a11',
    '2bc6c7a6-8d9a-44e0-a8dc-b7e3642f6a11',
    900,
    'USD',
    'open',
    now() + interval '12 day'
  )
on conflict (id) do nothing;

insert into public.settlements (id, merchant_id, amount, currency, status, scheduled_at, processed_at)
values
  (
    '73f74911-8499-4e64-a1e9-7f2ebf760a32',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    780000,
    'USD',
    'processing',
    now() + interval '1 day',
    null
  ),
  (
    '8426dbb3-ec0b-41b4-847f-37ab11520a33',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    128000,
    'EUR',
    'pending',
    now() + interval '2 day',
    null
  )
on conflict (id) do nothing;

insert into public.sub_merchants (id, merchant_id, name, email, status)
values
  (
    '95ef7d2b-65dd-4f00-b4f8-3441c3400a34',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'Harbor District Outlet',
    'manager@harbordistrictoutlet.com',
    'active'
  )
on conflict (id) do nothing;

insert into public.split_transfers (id, merchant_id, payment_id, sub_merchant_id, amount, currency, status)
values
  (
    'a647f8c9-88c3-48b4-ac27-4d9ecda50a35',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '7a49d4c2-b4b1-4f84-9a87-12d2f0500a01',
    '95ef7d2b-65dd-4f00-b4f8-3441c3400a34',
    36000,
    'USD',
    'pending'
  )
on conflict (id) do nothing;

insert into public.wallet_sessions (id, merchant_id, customer_id, amount, currency, provider, status, client_secret)
values
  (
    'b7c1218f-65e1-43fc-b24d-e3491f9b0a36',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    '2ab77f30-ecf8-4f52-bbf9-6d6688c16b22',
    450000,
    'INR',
    'google_pay',
    'authorized',
    'gpay_seed_client_secret_aurelia_1515'
  )
on conflict (id) do nothing;

insert into public.merchant_payment_preferences (merchant_id, allow_card, allow_bank, allow_crypto)
values
  ('8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11', true, true, true),
  ('b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22', true, true, false),
  ('c9a1f2e7-2b9d-4fc8-a712-7de84d903f33', true, false, false)
on conflict (merchant_id) do update
set
  allow_card = excluded.allow_card,
  allow_bank = excluded.allow_bank,
  allow_crypto = excluded.allow_crypto,
  updated_at = now();

insert into public.notifications (id, merchant_id, channel, title, message, status, read_at)
values
  (
    'c8127061-56b6-4d15-9a56-5e15f8f00a37',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'dashboard',
    'Payout Scheduled',
    'Your next settlement payout is scheduled for tomorrow at 10:00 AM UTC.',
    'unread',
    null
  ),
  (
    'd9f5e12b-7af6-4dc6-9971-d4f353380a38',
    '8f6a1b5c-1d7f-4e70-93d2-1f2c0b7a9e11',
    'email',
    'Dispute Update',
    'Dispute case #DB-204 has moved to under review by the risk team.',
    'read',
    now() - interval '3 hour'
  ),
  (
    'ebd2fdb4-8eab-4a42-9f91-d1c0b45f0a39',
    'b3d4c8aa-6e4f-41d8-b4d9-9a1f4d2c7e22',
    'dashboard',
    'Daily Reconciliation Ready',
    'Your daily payment reconciliation export is ready to download.',
    'unread',
    null
  )
on conflict (id) do nothing;
