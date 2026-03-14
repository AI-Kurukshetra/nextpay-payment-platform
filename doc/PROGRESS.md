# PROGRESS

[2026-03-14 09:25] codex — Initialized Next.js scaffold, payment API routes, validation/service tests, and `/doc` tracking docs.
[2026-03-14 09:25] codex — Ran project checks successfully: `pnpm lint`, `pnpm typecheck`, `pnpm test`.
[2026-03-14 09:33] codex — Implemented full PRD-aligned MVP modules in `/api/v1` with service layer, tests, and migration scaffold.
[2026-03-14 09:33] codex — Redesigned UI to a polished, responsive, merchant-friendly dashboard and checkout experience.
[2026-03-14 09:45] codex — Added Supabase-backed persistence mode across services with in-memory fallback for local execution.
[2026-03-14 09:45] codex — Added DB scaling migration: idempotency key support, composite indexes, queue index, and BRIN time-series indexes.
[2026-03-14 09:53] codex — Added `doc/SESSION_RESUME.md` with completed vs pending tasks and next-session resume prompt.
[2026-03-14 10:00] codex — Removed unused `nuqs` dependency to fix npm ERESOLVE peer conflict.
[2026-03-14 10:30] codex — Implemented dashboard session auth (login/register + cookie-based access + logout endpoint).
[2026-03-14 10:30] codex — Switched dashboard from mock data to live merchant data and added `supabase/seed.sql`.
[2026-03-14 10:46] codex — Added Swagger UI endpoint (`/api/docs`) and OpenAPI spec endpoint (`/api/v1/openapi`) documenting all v1 APIs.
[2026-03-14 11:17] codex — Added worker orchestration, API key lifecycle + audit logs, session hardening, and passing Playwright E2E coverage.
[2026-03-14 11:34] codex — Implemented reporting/export, payment links, disputes, fraud-rule configuration, and webhook endpoint verification APIs.
[2026-03-14 11:42] codex — Implemented payment-method vault, invoices, settlements, and settlement worker processing APIs.
[2026-03-14 11:47] codex — Implemented marketplace split APIs, wallet sessions, 3DS endpoint, SSE transaction stream, and matching migration/OpenAPI updates.
[2026-03-14 11:51] codex — Optimized payment list filtering to push constraints into Supabase query path and optimized stream endpoint to fetch latest-window rows only.
[2026-03-14 12:14] codex — Implemented FX conversion + settlement currency tracking, payment processor router, dunning/proration subscription updates, payout-provider execution model, and 3DS initiation flow.
[2026-03-14 12:14] codex — Added embeddable checkout SDK script, live dashboard transaction stream panel, analytics method-performance API, and validated all checks (`lint`, `typecheck`, `test`).
[2026-03-14 12:30] codex — Added env-configured external provider adapters for payout rails, wallet authorization, and 3DS orchestration with resilient mock fallback.
[2026-03-14 12:30] codex — Added full SDK suite scaffolding (Node.js, Python, PHP, Java, .NET, Ruby) under `/sdk` and revalidated checks.
[2026-03-14 12:46] codex — Expanded currency coverage to runtime ISO catalog and updated checkout UI to support broad multi-currency selection.
[2026-03-14 12:46] codex — Implemented advanced feature APIs: optimization, GraphQL gateway, crypto quotes/payments, A/B experiments, compliance reports, cashflow forecasting, and dynamic pricing recommendations.
[2026-03-14 14:55] codex — Implemented merchant dashboard webhook management UI with create/update/delete/verify actions and test event trigger flow.
[2026-03-14 14:55] codex — Added webhook endpoint PATCH/DELETE API routes, service methods, webhook validation schema extension, and regression tests.
[2026-03-14 15:14] codex — Reworked payments dashboard filters to auto-apply on change with debounce and added max/date filters plus clear action.
[2026-03-14 15:14] codex — Updated payment filter date validation to accept parseable date strings for consistent dashboard/API filtering.
[2026-03-14 15:55] codex — Refined payments filters into compact grouped controls (Amount Range and Date Range) with clearer labels and reduced vertical space.
[2026-03-14 15:55] codex — Fixed amount range reliability by normalizing min/max inputs, guarding query parsing against invalid numbers, and hardening in-memory filter checks.
[2026-03-14 15:58] codex — Removed amount range controls from payments filters per UX direction; retained compact auto-apply search/status/currency/date filters.
[2026-03-14 16:00] codex — Fixed filter bar overlap by switching to a responsive grid layout and pinning clear action alignment across breakpoints.
[2026-03-14 16:14] codex — Audited ignore files and tightened `.gitignore` to prevent IDE/env/log/local-store artifacts from being pushed.
