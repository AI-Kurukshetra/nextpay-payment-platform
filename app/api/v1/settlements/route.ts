import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createSettlement, listSettlements } from "@/lib/services/settlement-service";
import { createSettlementSchema } from "@/lib/validations/settlement";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createSettlementSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const settlement = await createSettlement(merchant, parsed.data);
    return jsonOk(settlement, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const settlements = await listSettlements(merchant);
    return jsonOk(settlements);
  } catch (error) {
    return jsonError(error);
  }
}
