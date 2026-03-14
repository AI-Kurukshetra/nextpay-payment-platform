# PayForge

Developer-first payment gateway MVP on Next.js 15.

## Implemented Modules
- Merchant auth (`/api/v1/auth/register`, `/api/v1/auth/login`)
- API key lifecycle (`/api/v1/auth/api-keys`, `/rotate`, `/revoke`, `/audit`)
- Payments (create, fetch, capture)
- Payment routing + multi-currency settlement conversion
- Broad ISO currency support in checkout (runtime currency catalog)
- Refunds (partial/full)
- Disputes (create, list, lifecycle update)
- Customers (create, list, fetch)
- Subscriptions (plans + subscriptions)
- Webhooks (endpoint registration, event emit, retry processor)
- Payment links (create/list/get/pay by token)
- Payment methods vault (tokenized card references)
- Invoices (create/list/update)
- Settlements (create/list/process)
- Payout execution model (standard/instant, provider simulation, fees)
- Background worker processor (`/api/v1/internal/worker/process`)
- Fraud detection (risk scoring + alerts)
- Fraud rule management (create/list/update custom risk rules)
- Analytics overview
- Analytics method-performance (`/api/v1/analytics/method-performance`)
- Predictive cashflow forecasting (`/api/v1/analytics/cashflow/forecast`)
- AI optimization recommendations (`/api/v1/optimization/recommendations`)
- GraphQL gateway (`/api/v1/graphql`)
- Crypto payments (`/api/v1/payments/crypto/quote`, `/api/v1/payments/crypto/confirm`)
- A/B experimentation APIs (`/api/v1/experiments`, `/api/v1/experiments/:id/assign`)
- Compliance automation reports (`/api/v1/compliance/reports`)
- Dynamic pricing recommendation (`/api/v1/pricing/recommendation`)
- Reporting (summary + CSV transaction export)
- Sandbox test cards endpoint
- Merchant dashboard UI + universal checkout widget
- Real-time transaction stream (`/api/v1/stream/transactions`) + dashboard live panel
- 3DS flow (`/payments/:id/3ds/initiate` + `/authenticate`)
- Embeddable web SDK script (`/sdk/payforge-checkout.js`)

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
- `NEXTPAY_PAYOUT_PROVIDER` (`stripe_treasury` | `razorpayx` | mock default)
- `NEXTPAY_PAYOUT_PROVIDER_URL` / `NEXTPAY_PAYOUT_PROVIDER_KEY`
- `NEXTPAY_WALLET_PROVIDER_URL` / `NEXTPAY_WALLET_PROVIDER_KEY`
- `NEXTPAY_3DS_PROVIDER_URL` / `NEXTPAY_3DS_PROVIDER_KEY`
- `NEXTPAY_PROCESSOR_PROVIDER_URL` / `NEXTPAY_PROCESSOR_PROVIDER_KEY`

Optional Postgres creds (if you connect directly):
- `POSTGRES_HOST`
- `POSTGRES_PORT` (typically `5432`)
- `POSTGRES_DB` (typically `postgres`)
- `POSTGRES_USER` (typically `postgres`)
- `POSTGRES_PASSWORD`
- `DATABASE_URL`

## Database Setup
Apply migrations in order:
1. `supabase/migrations/20260314093000_init_payforge.sql`
2. `supabase/migrations/20260314095500_performance_indexes.sql`
3. `supabase/migrations/20260314110000_api_key_audit_worker.sql`
4. `supabase/migrations/20260314123000_feature_gap_close.sql`
5. `supabase/migrations/20260314130000_payments_extensions.sql`
6. `supabase/migrations/20260314134500_marketplace_wallet_streaming.sql`
7. `supabase/migrations/20260314143000_subscription_dunning.sql`

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
  - Dashboard mutation route: `payforge_dashboard_session` cookie (`DashboardSessionCookie`)

## Real-World Simulation Mode (No Real Stripe/Razorpay Keys)
Use local mock provider routes to simulate production-like external processors and rails:

```bash
NEXTPAY_PROCESSOR_PROVIDER_URL=http://localhost:3000/api/mock/providers \
NEXTPAY_PROCESSOR_PROVIDER_KEY=mock_key \
NEXTPAY_PAYOUT_PROVIDER_URL=http://localhost:3000/api/mock/providers \
NEXTPAY_PAYOUT_PROVIDER_KEY=mock_key \
NEXTPAY_WALLET_PROVIDER_URL=http://localhost:3000/api/mock/providers \
NEXTPAY_WALLET_PROVIDER_KEY=mock_key \
NEXTPAY_3DS_PROVIDER_URL=http://localhost:3000/api/mock/providers \
NEXTPAY_3DS_PROVIDER_KEY=mock_key \
pnpm dev
```

Mock endpoints included:
- `POST /api/mock/providers/processors/authorize`
- `POST /api/mock/providers/payouts`
- `POST /api/mock/providers/wallets/authorize`
- `POST /api/mock/providers/3ds/initiate`
- `POST /api/mock/providers/3ds/complete`

## Project Structure
- `app/api/v1/*` API routes
- `lib/services/*` business logic layer
- `lib/validations/*` Zod contracts
- `supabase/migrations/*` database schema + RLS
- `app/(dashboard)/*` merchant dashboard UI
- `components/checkout/*` embeddable checkout component
- `sdk/*` language SDK scaffolds
