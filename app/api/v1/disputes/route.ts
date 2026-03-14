import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createDispute, listDisputes } from "@/lib/services/dispute-service";
import { createDisputeSchema } from "@/lib/validations/dispute";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createDisputeSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const dispute = await createDispute(merchant, parsed.data);
    return jsonOk(dispute, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const disputes = await listDisputes(merchant);
    return jsonOk(disputes);
  } catch (error) {
    return jsonError(error);
  }
}
