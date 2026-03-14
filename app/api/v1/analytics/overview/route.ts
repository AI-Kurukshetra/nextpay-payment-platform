import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getAnalyticsOverview } from "@/lib/services/analytics-service";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const overview = await getAnalyticsOverview(merchant);
    return jsonOk(overview);
  } catch (error) {
    return jsonError(error);
  }
}
