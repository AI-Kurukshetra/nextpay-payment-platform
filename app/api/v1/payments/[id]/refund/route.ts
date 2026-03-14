import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createRefund } from "@/lib/services/refund-service";
import { refundPaymentSchema } from "@/lib/validations/payment";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = refundPaymentSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const { id } = await context.params;
    const refund = await createRefund(merchant, id, parsed.data);
    return jsonOk(refund, 201);
  } catch (error) {
    return jsonError(error);
  }
}
