import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { listMerchantApiKeys } from "@/lib/services/auth-service";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const keys = await listMerchantApiKeys(merchant);
    return jsonOk(keys);
  } catch (error) {
    return jsonError(error);
  }
}
