import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getOptimizationRecommendations } from "@/lib/services/optimization-service";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const recommendations = await getOptimizationRecommendations(merchant);
    return jsonOk(recommendations);
  } catch (error) {
    return jsonError(error);
  }
}
