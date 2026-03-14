import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createPayment, listPayments } from "@/lib/services/payment-service";
import { createPaymentSchema } from "@/lib/validations/payment";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const idempotencyKey = request.headers.get("x-idempotency-key") ?? undefined;
    const payload = await request.json();
    const parsed = createPaymentSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const payment = await createPayment(merchant, parsed.data, idempotencyKey);
    return jsonOk(payment, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payments = await listPayments(merchant);
    return jsonOk(payments);
  } catch (error) {
    return jsonError(error);
  }
}
