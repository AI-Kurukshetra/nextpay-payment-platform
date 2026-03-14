import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createSubscription, listSubscriptions } from "@/lib/services/subscription-service";
import { createSubscriptionSchema } from "@/lib/validations/subscription";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createSubscriptionSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const subscription = await createSubscription(merchant, parsed.data);
    return jsonOk(subscription, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const subscriptions = await listSubscriptions(merchant);
    return jsonOk(subscriptions);
  } catch (error) {
    return jsonError(error);
  }
}
