import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getPaymentsReportSummary } from "@/lib/services/reporting-service";
import { listPaymentsQuerySchema } from "@/lib/validations/payment";

export async function GET(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { searchParams } = new URL(request.url);
    const parsed = listPaymentsQuerySchema.safeParse({
      q: searchParams.get("q") ?? undefined,
      status: searchParams.get("status") ?? undefined,
      currency: searchParams.get("currency") ?? undefined,
      minAmount: searchParams.get("minAmount") ? Number(searchParams.get("minAmount")) : undefined,
      maxAmount: searchParams.get("maxAmount") ? Number(searchParams.get("maxAmount")) : undefined,
      createdFrom: searchParams.get("createdFrom") ?? undefined,
      createdTo: searchParams.get("createdTo") ?? undefined
    });

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const summary = await getPaymentsReportSummary(merchant, parsed.data);
    return jsonOk(summary);
  } catch (error) {
    return jsonError(error);
  }
}
