# TASKS

## Completed
- [x] 2026-03-14 09:25 — Create `/doc` operational tracking files
- [x] 2026-03-14 09:25 — Bootstrap Next.js 15 + TypeScript + Tailwind project structure
- [x] 2026-03-14 09:25 — Implement initial payment create/fetch API
- [x] 2026-03-14 09:33 — Implement full API v1 MVP surface (auth, payments, refunds, customers, subscriptions, webhooks, fraud, analytics, sandbox)
- [x] 2026-03-14 09:33 — Implement service-layer business logic for all core modules
- [x] 2026-03-14 09:33 — Add Supabase initial schema migration with RLS scaffolding
- [x] 2026-03-14 09:33 — Build user-friendly merchant UI (auth pages, dashboard pages, checkout widget)
- [x] 2026-03-14 09:33 — Add unit tests for services and validations
- [x] 2026-03-14 09:45 — Wire service layer to Supabase persistence mode with in-memory fallback
- [x] 2026-03-14 09:45 — Add high-concurrency DB migration (indexes + idempotency key strategy)
- [x] 2026-03-14 09:53 — Create `/doc/SESSION_RESUME.md` for resumable session handoff
- [x] 2026-03-14 10:30 — Implement working login/register UI + cookie session auth for dashboard
- [x] 2026-03-14 10:30 — Replace dashboard mock data with live service-backed data
- [x] 2026-03-14 10:30 — Add Supabase seed data (`supabase/seed.sql`) for quick demo bootstrap
- [x] 2026-03-14 10:46 — Add Swagger/OpenAPI docs (`/api/docs` UI + `/api/v1/openapi` JSON)
- [x] 2026-03-14 11:17 — Add background worker orchestration for webhook retries and subscription billing cycles
- [x] 2026-03-14 11:17 — Implement API key rotation/revocation endpoints with audit log tracking
- [x] 2026-03-14 11:17 — Add Playwright E2E tests for merchant register/login flows
- [x] 2026-03-14 11:17 — Harden dashboard session protection with signed cookie tokens and middleware checks

## Next
- [ ] Add worker scheduling/deployment docs for production cron setup
- [ ] Add RLS policies for new `merchant_api_keys` and `api_audit_logs` tables
