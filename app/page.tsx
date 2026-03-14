import Link from "next/link";

const APIs = [
  "POST /api/v1/auth/register",
  "POST /api/v1/payments",
  "POST /api/v1/payments/:id/capture",
  "POST /api/v1/payments/:id/refund",
  "POST /api/v1/webhooks/endpoints",
  "GET /api/v1/analytics/overview"
];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <section className="glass relative overflow-hidden rounded-3xl p-8 md:p-12">
        <div className="absolute -right-16 -top-20 h-44 w-44 rounded-full bg-cyan-200/60 blur-2xl" />
        <div className="absolute -bottom-16 left-8 h-40 w-40 rounded-full bg-amber-200/70 blur-2xl" />

        <p className="text-sm uppercase tracking-[0.2em] text-cyan-700">PayForge Platform</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-semibold leading-tight md:text-6xl" style={{ fontFamily: "var(--font-heading)" }}>
          Payments Infra That Feels Instant For Developers And Merchants
        </h1>
        <p className="mt-4 max-w-2xl text-base text-slate-600 md:text-lg">
          End-to-end MVP for payment intents, capture, refunds, webhooks, fraud alerts, subscriptions, and analytics.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-medium text-white hover:bg-teal-700" href="/overview">
            Open Merchant Dashboard
          </Link>
          <Link className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium hover:bg-slate-50" href="/register">
            Create Merchant Account
          </Link>
          <Link className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-medium hover:bg-slate-50" href="/api/docs">
            Open Swagger Docs
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2">
        <article className="glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold">Production-Style API Surface</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-700" style={{ fontFamily: "var(--font-mono)" }}>
            {APIs.map((endpoint) => (
              <li className="rounded-lg bg-slate-50 px-3 py-2" key={endpoint}>
                {endpoint}
              </li>
            ))}
          </ul>
        </article>

        <article className="glass rounded-2xl p-5">
          <h2 className="text-lg font-semibold">MVP Modules</h2>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {[
              "Payments",
              "Refunds",
              "Webhooks",
              "Fraud",
              "Subscriptions",
              "Customers",
              "Analytics",
              "Sandbox"
            ].map((moduleName) => (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2" key={moduleName}>
                {moduleName}
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
