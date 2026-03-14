import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { authenticatePaymentThreeDS } from "@/lib/services/payment-service";
import { authenticateThreeDSSchema } from "@/lib/validations/wallet";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await params;
    const payload = await request.json();
    const parsed = authenticateThreeDSSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const payment = await authenticatePaymentThreeDS(merchant, id, parsed.data);
    return jsonOk(payment);
  } catch (error) {
    return jsonError(error);
  }
}
