import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { listWebhookEndpoints, registerWebhookEndpoint } from "@/lib/services/webhook-service";
import { registerWebhookEndpointSchema } from "@/lib/validations/webhook";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = registerWebhookEndpointSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const endpoint = await registerWebhookEndpoint(merchant, parsed.data);
    return jsonOk(endpoint, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const endpoints = await listWebhookEndpoints(merchant);
    return jsonOk(endpoints);
  } catch (error) {
    return jsonError(error);
  }
}
