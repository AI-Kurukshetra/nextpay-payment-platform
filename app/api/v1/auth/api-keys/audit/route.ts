import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { listMerchantApiAuditLogs } from "@/lib/services/auth-service";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const logs = await listMerchantApiAuditLogs(merchant);
    return jsonOk(logs);
  } catch (error) {
    return jsonError(error);
  }
}
