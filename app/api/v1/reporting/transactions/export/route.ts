import { requireMerchant } from "@/lib/api/auth";
import { jsonError } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { exportPaymentsCsv } from "@/lib/services/reporting-service";
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
      return new Response(JSON.stringify({ error: "validation_error", details: parsed.error.flatten() }), {
        status: 400,
        headers: { "content-type": "application/json" }
      });
    }

    const csv = await exportPaymentsCsv(merchant, parsed.data);
    return new Response(csv, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": "attachment; filename=payforge-transactions.csv"
      }
    });
  } catch (error) {
    return jsonError(error);
  }
}
