# DECISIONS

## 2026-03-14
- Adopted AGENTS Next.js + Supabase-oriented architecture for implementation direction.
- Implemented a full MVP API contract under `/api/v1` to align with API spec and PRD scope.
- Kept business logic in service layer with route handlers as thin orchestrators.
- Used an in-memory repository as an interim execution adapter to unblock full-stack MVP behavior before Supabase wiring.
- Added a Supabase SQL migration and RLS policy scaffold to define production persistence path.
- Prioritized a high-usability dashboard UI system: stronger typography, clear hierarchy, responsive structure, and low-friction actions.
- Added dual persistence strategy: Supabase for real environments and in-memory fallback for deterministic local tests.
- Enforced payment idempotency at DB level with unique `(merchant_id, idempotency_key)` to protect against duplicate writes during retries.
- Added query-path indexes + BRIN on append-heavy tables to keep read latency stable under high write volume.
- Added a dedicated session handoff artifact (`doc/SESSION_RESUME.md`) to reduce context loss between Codex sessions.
- Replaced env-based dashboard identity with cookie session auth from login/register flow to support normal merchant UX.
- Kept API key as merchant credential source, but moved dashboard consumption to server-only session cookie.
- Added deterministic seed data to accelerate local and staging validation of dashboard and API behavior.
- Implemented dependency-free Swagger delivery (static Swagger UI CDN + server-generated OpenAPI JSON) to keep docs interactive without adding runtime packages.
- Introduced API key lifecycle model (`merchant_api_keys`) plus immutable audit trail (`api_audit_logs`) instead of single-hash-only key management.
- Added secret-protected worker orchestration endpoint so retries and billing cycles can run from cron/queue executors without coupling to UI traffic.
- Switched dashboard cookie from raw API key to signed merchant session payload to avoid exposing long-lived API credentials in session cookies.
- Configured Playwright to run against built server + local Chrome channel for deterministic local E2E execution in this environment.
