import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { revokeMerchantApiKey } from "@/lib/services/auth-service";
import { revokeApiKeySchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = revokeApiKeySchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const result = await revokeMerchantApiKey(merchant, parsed.data);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
