import { UniversalCheckout } from "@/components/checkout/universal-checkout";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { getOverviewData } from "@/lib/dashboard/data";

export const metadata = {
  title: "Overview | NextPay"
};

function formatAmount(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(amount / 100);
}

export default async function OverviewPage() {
  const data = await getOverviewData();

  return (
    <section className="space-y-4">
      {!data.isConfigured ? (
        <div className="glass rounded-2xl p-4 text-sm text-amber-800">
          Login required. Please sign in to view live merchant data.
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-4">
        <KpiCard label="Total Volume" value={formatAmount(data.kpis.totalPaymentVolume)} />
        <KpiCard
          label="Success Rate"
          value={`${(data.kpis.successRate * 100).toFixed(2)}%`}
        />
        <KpiCard label="Fraud Rate" value={`${(data.kpis.fraudRate * 100).toFixed(2)}%`} />
        <KpiCard label="Active Subs" value={String(data.kpis.activeSubscriptions)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
        <UniversalCheckout />

        <article className="glass rounded-2xl p-5">
          <h3 className="text-lg font-semibold">Webhook Event Stream</h3>
          <p className="mt-1 text-sm text-slate-600">Recent real event types from your merchant account.</p>
          <ul className="mt-4 space-y-2 text-sm">
            {data.eventTypes.length === 0 ? (
              <li className="rounded-lg bg-white px-3 py-2 text-slate-500">No events yet.</li>
            ) : (
              data.eventTypes.map((eventName) => (
                <li className="flex items-center justify-between rounded-lg bg-white px-3 py-2" key={eventName}>
                  <span className="font-medium">{eventName}</span>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">active</span>
                </li>
              ))
            )}
          </ul>
        </article>
      </div>
    </section>
  );
}
