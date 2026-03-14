import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getPaymentRoutingDetails } from "@/lib/services/payment-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await params;
    const details = await getPaymentRoutingDetails(merchant, id);
    return jsonOk(details);
  } catch (error) {
    return jsonError(error);
  }
}
