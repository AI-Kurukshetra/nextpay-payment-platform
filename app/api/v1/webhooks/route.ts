import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { emitWebhookEvent, listWebhookDeliveries } from "@/lib/services/webhook-service";
import { emitWebhookEventSchema } from "@/lib/validations/webhook";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = emitWebhookEventSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const event = await emitWebhookEvent(merchant, parsed.data);
    return jsonOk(event, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const deliveries = await listWebhookDeliveries(merchant);
    return jsonOk(deliveries);
  } catch (error) {
    return jsonError(error);
  }
}
