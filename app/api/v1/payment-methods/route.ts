import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createPaymentMethod, listPaymentMethods } from "@/lib/services/payment-method-service";
import { createPaymentMethodSchema } from "@/lib/validations/payment-method";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createPaymentMethodSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const method = await createPaymentMethod(merchant, parsed.data);
    return jsonOk(method, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get("customerId") ?? undefined;
    const methods = await listPaymentMethods(merchant, customerId);
    return jsonOk(methods);
  } catch (error) {
    return jsonError(error);
  }
}
