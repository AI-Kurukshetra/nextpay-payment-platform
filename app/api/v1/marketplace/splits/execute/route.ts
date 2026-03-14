import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { executePaymentSplit, listSplitTransfers } from "@/lib/services/marketplace-service";
import { splitExecuteSchema } from "@/lib/validations/marketplace";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = splitExecuteSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const result = await executePaymentSplit(merchant, parsed.data);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const transfers = await listSplitTransfers(merchant);
    return jsonOk(transfers);
  } catch (error) {
    return jsonError(error);
  }
}
