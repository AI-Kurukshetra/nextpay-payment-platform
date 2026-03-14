import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { listRefunds } from "@/lib/services/refund-service";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const refunds = await listRefunds(merchant);
    return jsonOk(refunds);
  } catch (error) {
    return jsonError(error);
  }
}
