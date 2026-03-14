# SCHEMA

## Migration History
- `20260314093000_init_nextpay.sql`
- `20260314095500_performance_indexes.sql`
- `20260314110000_api_key_audit_worker.sql`

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

## RLS
RLS enabled on all tables.
Current policies provide merchant-scoped `SELECT` access using `(select auth.uid())` patterns.
New tables `merchant_api_keys` and `api_audit_logs` have RLS enabled; explicit policies are pending.

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
