import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { deleteWebhookEndpoint, updateWebhookEndpoint } from "@/lib/services/webhook-service";
import { updateWebhookEndpointSchema } from "@/lib/validations/webhook";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = updateWebhookEndpointSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const { id } = await context.params;
    const endpoint = await updateWebhookEndpoint(merchant, id, parsed.data);
    return jsonOk(endpoint);
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await context.params;
    const deleted = await deleteWebhookEndpoint(merchant, id);
    return jsonOk(deleted);
  } catch (error) {
    return jsonError(error);
  }
}
