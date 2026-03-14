# NextPay

Developer-first payment gateway MVP on Next.js 15.

## Implemented Modules
- Merchant auth (`/api/v1/auth/register`, `/api/v1/auth/login`)
- API key lifecycle (`/api/v1/auth/api-keys`, `/rotate`, `/revoke`, `/audit`)
- Payments (create, fetch, capture)
- Refunds (partial/full)
- Customers (create, list, fetch)
- Subscriptions (plans + subscriptions)
- Webhooks (endpoint registration, event emit, retry processor)
- Background worker processor (`/api/v1/internal/worker/process`)
- Fraud detection (risk scoring + alerts)
- Analytics overview
- Sandbox test cards endpoint
- Merchant dashboard UI + universal checkout widget

## Stack
- Next.js 15 (App Router)
- TypeScript strict mode
- Tailwind CSS v3
- Zod validation
- Vitest tests
- Supabase schema migration scaffold

## Run
```bash
pnpm install
pnpm dev
```

## Supabase Persistence Modes
- `NEXTPAY_PERSISTENCE=memory` (default): in-memory runtime for local development/tests.
- `NEXTPAY_PERSISTENCE=supabase`: uses Supabase tables via service-role client.

Required env vars:
- `NEXTPAY_PERSISTENCE`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXTPAY_SESSION_SECRET` (required in production)
- `NEXTPAY_WORKER_SECRET`
- `NEXTPAY_BASE_URL` (worker script target)
- `NEXTPAY_WORKER_INTERVAL_MS`

Optional Postgres creds (if you connect directly):
- `POSTGRES_HOST`
- `POSTGRES_PORT` (typically `5432`)
- `POSTGRES_DB` (typically `postgres`)
- `POSTGRES_USER` (typically `postgres`)
- `POSTGRES_PASSWORD`
- `DATABASE_URL`

## Database Setup
Apply migrations in order:
1. `supabase/migrations/20260314093000_init_nextpay.sql`
2. `supabase/migrations/20260314095500_performance_indexes.sql`

Seed sample data:
- `supabase/seed.sql`
- Demo seed API key: `np_live_seed_demo_key_123`

## Quality Checks
```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Background Worker
Run worker loop (requires app server running):
```bash
pnpm worker
```

The worker calls:
- `POST /api/v1/internal/worker/process`
which executes:
- webhook retry processing
- subscription billing cycle processing

## E2E Tests (Playwright)
```bash
pnpm test:e2e
```

## API Documentation (Swagger)
- Swagger UI: `/api/docs`
- OpenAPI JSON: `/api/v1/openapi`
- Auth methods in docs:
  - API routes: `x-api-key` header (`ApiKeyAuth`)
  - Dashboard mutation route: `nextpay_dashboard_session` cookie (`DashboardSessionCookie`)

## Project Structure
- `app/api/v1/*` API routes
- `lib/services/*` business logic layer
- `lib/validations/*` Zod contracts
- `supabase/migrations/*` database schema + RLS
- `app/(dashboard)/*` merchant dashboard UI
- `components/checkout/*` embeddable checkout component
