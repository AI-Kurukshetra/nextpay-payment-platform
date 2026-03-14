import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getPaymentMethodPerformance } from "@/lib/services/analytics-service";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const metrics = await getPaymentMethodPerformance(merchant);
    return jsonOk(metrics);
  } catch (error) {
    return jsonError(error);
  }
}
