import { headers } from "next/headers";
import { AppError } from "@/lib/api/errors";
import { jsonError, jsonOk } from "@/lib/api/http";
import { processSubscriptionBillingCycles } from "@/lib/services/subscription-service";
import { processWebhookRetries } from "@/lib/services/webhook-service";

function requireWorkerSecret(input: string | null) {
  const configured = process.env.NEXTPAY_WORKER_SECRET;
  if (!configured) {
    throw new AppError(500, "worker_secret_not_configured");
  }
  if (!input || input !== configured) {
    throw new AppError(401, "invalid_worker_secret");
  }
}

export async function POST() {
  try {
    const headerStore = await headers();
    requireWorkerSecret(headerStore.get("x-worker-secret"));

    const [webhooks, subscriptions] = await Promise.all([
      processWebhookRetries(),
      processSubscriptionBillingCycles()
    ]);

    return jsonOk({
      processedAt: new Date().toISOString(),
      webhooks: {
        processed: webhooks.length
      },
      subscriptions
    });
  } catch (error) {
    return jsonError(error);
  }
}
