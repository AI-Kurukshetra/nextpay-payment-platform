# SESSION_RESUME

Last updated: 2026-03-14 09:53

## Current State
- Stack: Next.js 15 + TypeScript + Tailwind + Supabase integration path.
- API: PRD-aligned MVP endpoints under `app/api/v1/*` are implemented.
- Services: All core business modules implemented in `lib/services/*`.
- Persistence: Dual mode is active.
  - `NEXTPAY_PERSISTENCE=memory` for local/dev tests.
  - `NEXTPAY_PERSISTENCE=supabase` for real DB persistence.
- DB: Initial schema + performance/index migrations exist in `supabase/migrations/*`.
- Tests: `pnpm lint`, `pnpm typecheck`, `pnpm test` are passing.

## Completed Work (from total tasks)
- [x] `/doc` tracking system created and maintained.
- [x] Project scaffolded with Next.js App Router.
- [x] Full API v1 MVP implemented:
  - auth, payments, capture, refunds, customers, subscriptions, webhooks, fraud alerts, analytics, sandbox cards.
- [x] Service-layer business logic implemented with clean route/service separation.
- [x] Supabase schema migration with RLS added.
- [x] High-throughput DB optimization migration added:
  - idempotency key support
  - composite indexes
  - retry queue index
  - BRIN time-series indexes.
- [x] Merchant dashboard and auth UI redesigned for better usability.
- [x] Unit tests added (17 passing).

## Pending Work (next resume targets)
1. Add background worker for webhook retries and subscription billing cycles.
2. Implement API key rotation and revocation APIs with audit logs.
3. Add Playwright E2E coverage for critical merchant journeys.
4. Add production session/auth protection for dashboard routes.

## Start-Next-Session Prompt
Use this prompt in a new Codex session:

```text
Read /doc/SESSION_RESUME.md, /doc/TASKS.md, /doc/PROGRESS.md, and /doc/BLOCKERS.md.
Summarize where we left off, what is complete, and what is pending.
Then continue with pending item #1 from SESSION_RESUME.md.
```
