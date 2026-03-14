import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createNotification, listNotifications } from "@/lib/services/notification-service";
import { createNotificationSchema } from "@/lib/validations/notification";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const notifications = await listNotifications(merchant);
    return jsonOk(notifications);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createNotificationSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }
    const notification = await createNotification(merchant, parsed.data);
    return jsonOk(notification, 201);
  } catch (error) {
    return jsonError(error);
  }
}
