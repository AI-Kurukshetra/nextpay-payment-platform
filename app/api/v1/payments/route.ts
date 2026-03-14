import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { assertNoSensitiveCardData } from "@/lib/security/pci";
import { createPayment, listPayments } from "@/lib/services/payment-service";
import { createPaymentSchema, listPaymentsQuerySchema } from "@/lib/validations/payment";

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
    assertNoSensitiveCardData(parsed.data.metadata);

    const payment = await createPayment(merchant, parsed.data, idempotencyKey);
    return jsonOk(payment, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { searchParams } = new URL(request.url);
    const parsed = listPaymentsQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      currency: searchParams.get("currency") ?? undefined,
      minAmount: searchParams.get("minAmount") ? Number(searchParams.get("minAmount")) : undefined,
      maxAmount: searchParams.get("maxAmount") ? Number(searchParams.get("maxAmount")) : undefined,
      createdFrom: searchParams.get("createdFrom") ?? undefined,
      createdTo: searchParams.get("createdTo") ?? undefined
    });

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const payments = await listPayments(merchant, parsed.data);
    return jsonOk(payments);
  } catch (error) {
    return jsonError(error);
  }
}
