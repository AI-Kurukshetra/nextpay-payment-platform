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
- [x] 2026-03-14 11:34 — Add transaction search/filter + CSV export + reporting summary APIs
- [x] 2026-03-14 11:34 — Add payment link management APIs (create/list/get/pay-by-token)
- [x] 2026-03-14 11:34 — Add dispute management APIs (create/list/get/update)
- [x] 2026-03-14 11:34 — Add configurable fraud rules API + rule-based risk increments
- [x] 2026-03-14 11:34 — Add webhook endpoint verification API and verification timestamp tracking
- [x] 2026-03-14 11:42 — Add payment-method vault APIs, invoice APIs, and settlement APIs + processing endpoint
- [x] 2026-03-14 11:47 — Add marketplace sub-merchant and split settlement APIs
- [x] 2026-03-14 11:47 — Add mobile wallet session APIs and 3DS authentication endpoint
- [x] 2026-03-14 11:47 — Add real-time transaction SSE stream endpoint
- [x] 2026-03-14 11:51 — Optimize payment filtering query path and stream payload fetch path
- [x] 2026-03-14 12:14 — Expand multi-currency flow with settlement-currency conversion and FX rate tracking
- [x] 2026-03-14 12:14 — Add payment-method router service and processor-aware payment metadata
- [x] 2026-03-14 12:14 — Upgrade subscriptions with dunning-attempt tracking and plan-change proration API
- [x] 2026-03-14 12:14 — Upgrade settlement processing with payout method/provider execution simulation and fee model
- [x] 2026-03-14 12:14 — Add 3DS initiate endpoint and strengthen 3DS state transition checks
- [x] 2026-03-14 12:14 — Add embeddable web checkout SDK script and live dashboard transaction stream panel
- [x] 2026-03-14 12:14 — Add advanced analytics endpoint for processor/currency performance metrics

## Next
- [x] 2026-03-14 12:30 — Add payout provider integration adapters (Stripe Treasury/RazorpayX style via env-configured provider APIs) with mock fallback
- [x] 2026-03-14 12:30 — Add SDK suite scaffolding (Node.js, Python, PHP, Java, .NET, Ruby)
- [x] 2026-03-14 12:46 — Expand supported currency catalog to runtime ISO list and wire checkout dropdown to full currency set
- [x] 2026-03-14 12:46 — Add AI optimization recommendations API for routing and retry policy
- [x] 2026-03-14 12:46 — Add GraphQL API gateway endpoint for payments/customers/analytics operations
- [x] 2026-03-14 12:46 — Add cryptocurrency quote + confirmation payment APIs
- [x] 2026-03-14 12:46 — Add A/B testing framework APIs (experiment create/list + deterministic variant assignment)
- [x] 2026-03-14 12:46 — Add compliance automation report API (PCI/GDPR/SOX framework snapshots)
- [x] 2026-03-14 12:46 — Add predictive cashflow forecast API and dynamic pricing recommendation API

## Remaining
- [ ] Implement voice-activated payment commands with ASR/NLU provider integration
- [ ] Implement biometric authentication gateway with production device attestation providers
- [ ] Implement smart-contract based settlement executor against live chains
- [ ] Implement IoT payment device fleet management APIs and provisioning
- [ ] Implement multi-chain blockchain explorer and on-chain trace indexing

## Latest
- [x] 2026-03-14 14:55 — Add dashboard webhook endpoint management (create/update/delete/verify + test event trigger UI) and matching API/service support
- [x] 2026-03-14 15:14 — Improve payments filters UX: auto-apply on change (no submit), add max/date filters, and relax date parsing compatibility
- [x] 2026-03-14 15:55 — Fix amount range filtering reliability and compact payments filter UI with merged amount/date controls and clearer labels
- [x] 2026-03-14 15:58 — Remove amount range controls from payments UI and keep compact auto-apply search/status/currency/date filters
- [x] 2026-03-14 16:00 — Fix payments filter layout overlap by replacing fixed-width wrap with responsive grid and clear-button alignment
- [x] 2026-03-14 16:14 — Harden repository ignore rules for GitHub push (`.idea/.vscode/.env.*/*.log/.pnpm-store` with `.env.example` allowlist)
