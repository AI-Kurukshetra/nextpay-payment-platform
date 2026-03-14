import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { updateNotification } from "@/lib/services/notification-service";
import { updateNotificationSchema } from "@/lib/validations/notification";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = updateNotificationSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }
    const { id } = await context.params;
    const notification = await updateNotification(merchant, id, parsed.data);
    return jsonOk(notification);
  } catch (error) {
    return jsonError(error);
  }
}
