import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { forecastCashflow } from "@/lib/services/forecast-service";

export async function GET(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { searchParams } = new URL(request.url);
    const horizonDays = Number(searchParams.get("horizonDays") ?? 14);
    const forecast = await forecastCashflow(merchant, Number.isNaN(horizonDays) ? 14 : Math.max(1, Math.min(60, horizonDays)));
    return jsonOk(forecast);
  } catch (error) {
    return jsonError(error);
  }
}
