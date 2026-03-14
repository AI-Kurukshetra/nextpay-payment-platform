import { getWebhooksData } from "@/lib/dashboard/data";
import { WebhooksManager } from "@/components/dashboard/webhooks-manager";

export const metadata = { title: "Webhooks | PayForge" };

export default async function WebhooksPage() {
  const { isConfigured, endpoints, deliveries, events } = await getWebhooksData();

  return (
    <>
      {!isConfigured ? (
        <section className="glass rounded-2xl p-5">
          <h2 className="text-xl font-semibold">Webhooks</h2>
          <p className="mt-1 text-sm text-slate-600">Signed events, retry queue, and delivery observability.</p>
          <p className="mt-4 text-sm text-amber-700">Login required to load live rows.</p>
        </section>
      ) : (
        <WebhooksManager deliveries={deliveries} endpoints={endpoints} events={events} />
      )}
    </>
  );
}
