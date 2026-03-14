import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { processSubscriptionBillingCycles } from "@/lib/services/subscription-service";

export async function POST() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const result = await processSubscriptionBillingCycles(new Date(), merchant.id);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
