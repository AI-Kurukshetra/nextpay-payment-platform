import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createSubscriptionPlan, listSubscriptionPlans } from "@/lib/services/subscription-service";
import { createSubscriptionPlanSchema } from "@/lib/validations/subscription";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createSubscriptionPlanSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const plan = await createSubscriptionPlan(merchant, parsed.data);
    return jsonOk(plan, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const plans = await listSubscriptionPlans(merchant);
    return jsonOk(plans);
  } catch (error) {
    return jsonError(error);
  }
}
