import { getSubscriptionsData } from "@/lib/dashboard/data";

export const metadata = { title: "Subscriptions | NextPay" };

export default async function SubscriptionsPage() {
  const { isConfigured, subscriptions } = await getSubscriptionsData();

  return (
    <section className="space-y-4">
      <article className="glass rounded-2xl p-5">
        <h2 className="text-xl font-semibold">Subscription Billing</h2>
        <p className="mt-1 text-sm text-slate-600">Recurring billing lifecycle from live subscription records.</p>

        {!isConfigured ? (
          <p className="mt-4 text-sm text-amber-700">Login required to load live rows.</p>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {subscriptions.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-4 text-slate-500">No subscriptions yet.</div>
          ) : (
            subscriptions.map((subscription) => (
              <div className="rounded-xl border border-slate-200 bg-white p-4" key={subscription.id}>
                <h3 className="font-semibold">Sub {subscription.id.slice(0, 8)}</h3>
                <p className="mt-1 text-sm text-slate-600">Status: {subscription.status}</p>
                <p className="text-sm text-slate-600">
                  Next Billing: {new Date(subscription.nextBillingAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-slate-500">Plan ID: {subscription.planId}</p>
              </div>
            ))
          )}
        </div>
      </article>
    </section>
  );
}
