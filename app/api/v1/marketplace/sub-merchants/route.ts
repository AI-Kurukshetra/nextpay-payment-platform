import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createSubMerchant, listSubMerchants } from "@/lib/services/marketplace-service";
import { createSubMerchantSchema } from "@/lib/validations/marketplace";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createSubMerchantSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const subMerchant = await createSubMerchant(merchant, parsed.data);
    return jsonOk(subMerchant, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const subMerchants = await listSubMerchants(merchant);
    return jsonOk(subMerchants);
  } catch (error) {
    return jsonError(error);
  }
}
