import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getSubscriptionById, updateSubscription } from "@/lib/services/subscription-service";
import { updateSubscriptionSchema } from "@/lib/validations/subscription";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await context.params;
    const subscription = await getSubscriptionById(merchant, id);
    return jsonOk(subscription);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await context.params;
    const payload = await request.json();
    const parsed = updateSubscriptionSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const subscription = await updateSubscription(merchant, id, parsed.data);
    return jsonOk(subscription);
  } catch (error) {
    return jsonError(error);
  }
}
