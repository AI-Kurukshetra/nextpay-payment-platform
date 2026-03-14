import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import {
  getMerchantPaymentPreferences,
  updateMerchantPaymentPreferences
} from "@/lib/services/payment-preferences-service";
import { updatePaymentPreferencesSchema } from "@/lib/validations/payment-preferences";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const settings = await getMerchantPaymentPreferences(merchant);
    return jsonOk(settings);
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = updatePaymentPreferencesSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const settings = await updateMerchantPaymentPreferences(merchant, parsed.data);
    return jsonOk(settings);
  } catch (error) {
    return jsonError(error);
  }
}
