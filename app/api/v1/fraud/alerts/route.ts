import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { listFraudAlerts } from "@/lib/services/fraud-service";

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const alerts = await listFraudAlerts(merchant);
    return jsonOk(alerts);
  } catch (error) {
    return jsonError(error);
  }
}
