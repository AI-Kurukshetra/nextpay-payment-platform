import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { verifyWebhookEndpoint } from "@/lib/services/webhook-service";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await params;
    const result = await verifyWebhookEndpoint(merchant, id);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
