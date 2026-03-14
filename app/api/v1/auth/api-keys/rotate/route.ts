import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { rotateMerchantApiKey } from "@/lib/services/auth-service";
import { rotateApiKeySchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    let payload: unknown = {};
    try {
      payload = await request.json();
    } catch {
      payload = {};
    }
    const parsed = rotateApiKeySchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const rotated = await rotateMerchantApiKey(merchant, parsed.data);
    return jsonOk(rotated, 201);
  } catch (error) {
    return jsonError(error);
  }
}
