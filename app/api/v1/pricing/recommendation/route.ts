import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getDynamicPricingRecommendation } from "@/lib/services/pricing-service";
import { pricingRecommendationSchema } from "@/lib/validations/pricing";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = pricingRecommendationSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const recommendation = await getDynamicPricingRecommendation(merchant, parsed.data);
    return jsonOk(recommendation);
  } catch (error) {
    return jsonError(error);
  }
}
