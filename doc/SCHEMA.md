# SCHEMA

## Migration History
- `20260314093000_init_payforge.sql`
- `20260314095500_performance_indexes.sql`
- `20260314110000_api_key_audit_worker.sql`
- `20260314123000_feature_gap_close.sql`
- `20260314130000_payments_extensions.sql`
- `20260314134500_marketplace_wallet_streaming.sql`
- `20260314143000_subscription_dunning.sql`

## Tables
- `merchants`
- `customers`
- `payments`
- `refunds`
- `subscription_plans`
- `subscriptions`
- `webhook_endpoints`
- `webhook_events`
- `webhook_deliveries`
- `fraud_alerts`
- `merchant_api_keys`
- `api_audit_logs`
- `disputes`
- `payment_links`
- `fraud_rules`
- `payment_methods`
- `invoices`
- `settlements`
- `sub_merchants`
- `split_transfers`
- `wallet_sessions`

## RLS
RLS enabled on all tables.
Current policies provide merchant-scoped `SELECT` access using `(select auth.uid())` patterns.
New tables `merchant_api_keys` and `api_audit_logs` have RLS enabled; explicit policies are pending.
New tables `disputes`, `payment_links`, and `fraud_rules` have RLS enabled; explicit policies are pending.
New tables `sub_merchants`, `split_transfers`, and `wallet_sessions` have RLS enabled; explicit policies are pending.
`subscriptions` now includes `dunning_attempts` and `canceled_at` to support retry/cancellation workflows.

## Notes
Application supports dual runtime:
- `NEXTPAY_PERSISTENCE=memory` for local tests/dev.
- `NEXTPAY_PERSISTENCE=supabase` for persistent environments.

## Performance Notes
- `payments.idempotency_key` with unique merchant scope for safe retry semantics.
- Composite indexes added for merchant-scoped query patterns and dashboard filters.
- Retry queue index on `webhook_deliveries` for efficient worker polling.
- BRIN indexes on `payments.created_at` and `webhook_events.created_at` for large time-ordered datasets.
- Indexes added for API key and audit read paths:
  - `merchant_api_keys (merchant_id, status, created_at desc)`
  - `api_audit_logs (merchant_id, created_at desc)`
- Indexes added for new feature tables:
  - `disputes (merchant_id, created_at desc)`
  - `payment_links (merchant_id, created_at desc)`
  - `fraud_rules (merchant_id, is_active, created_at desc)`
- Indexes added for marketplace/wallet paths:
  - `sub_merchants (merchant_id, created_at desc)`
  - `split_transfers (merchant_id, payment_id, created_at desc)`
  - `wallet_sessions (merchant_id, status, created_at desc)`
- Index added for subscription retry scheduling:
  - `subscriptions (merchant_id, status, next_billing_at)`
