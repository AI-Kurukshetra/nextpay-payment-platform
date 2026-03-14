import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { assignExperimentVariant } from "@/lib/services/experiment-service";
import { assignExperimentVariantSchema } from "@/lib/validations/experiment";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await params;
    const payload = await request.json();
    const parsed = assignExperimentVariantSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const assignment = await assignExperimentVariant(merchant, id, parsed.data);
    return jsonOk(assignment);
  } catch (error) {
    return jsonError(error);
  }
}
