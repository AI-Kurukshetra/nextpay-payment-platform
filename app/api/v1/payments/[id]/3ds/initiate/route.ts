import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { initiatePaymentThreeDS } from "@/lib/services/payment-service";
import { initiateThreeDSSchema } from "@/lib/validations/wallet";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await params;
    const payload = await request.json();
    const parsed = initiateThreeDSSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const response = await initiatePaymentThreeDS(merchant, id, parsed.data);
    return jsonOk(response);
  } catch (error) {
    return jsonError(error);
  }
}
