import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { previewPaymentSplit } from "@/lib/services/marketplace-service";
import { splitPreviewSchema } from "@/lib/validations/marketplace";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = splitPreviewSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const preview = await previewPaymentSplit(merchant, parsed.data);
    return jsonOk(preview);
  } catch (error) {
    return jsonError(error);
  }
}
