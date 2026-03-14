import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { capturePayment } from "@/lib/services/payment-service";
import { capturePaymentSchema } from "@/lib/validations/payment";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = capturePaymentSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const { id } = await context.params;
    const payment = await capturePayment(merchant, id);
    return jsonOk(payment);
  } catch (error) {
    return jsonError(error);
  }
}
