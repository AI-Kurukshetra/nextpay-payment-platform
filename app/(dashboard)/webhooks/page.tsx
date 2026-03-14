import { getWebhooksData } from "@/lib/dashboard/data";

export const metadata = { title: "Webhooks | NextPay" };

export default async function WebhooksPage() {
  const { isConfigured, endpoints, deliveries, events } = await getWebhooksData();
  const eventMap = new Map(events.map((event) => [event.id, event.type]));
  const endpointMap = new Map(endpoints.map((endpoint) => [endpoint.id, endpoint.url]));

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-xl font-semibold">Webhooks</h2>
      <p className="mt-1 text-sm text-slate-600">Signed events, retry queue, and delivery observability.</p>

      {!isConfigured ? (
        <p className="mt-4 text-sm text-amber-700">Login required to load live rows.</p>
      ) : null}

      <div className="mt-4 space-y-2">
        {deliveries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500">No deliveries yet.</div>
        ) : (
          deliveries.slice(0, 12).map((delivery) => (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3" key={delivery.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{eventMap.get(delivery.eventId) ?? delivery.eventId}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{delivery.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{endpointMap.get(delivery.endpointId) ?? delivery.endpointId}</p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
