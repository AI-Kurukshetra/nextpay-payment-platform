import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { listWebhookDeliveries, processWebhookRetries } from "@/lib/services/webhook-service";

export async function POST() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    await processWebhookRetries(new Date(), merchant.id);
    const deliveries = await listWebhookDeliveries(merchant);
    return jsonOk(deliveries);
  } catch (error) {
    return jsonError(error);
  }
}
