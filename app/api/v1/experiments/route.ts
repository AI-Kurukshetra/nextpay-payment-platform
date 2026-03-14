import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createExperiment, listExperiments } from "@/lib/services/experiment-service";
import { createExperimentSchema } from "@/lib/validations/experiment";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createExperimentSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const experiment = await createExperiment(merchant, parsed.data);
    return jsonOk(experiment, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const items = await listExperiments(merchant);
    return jsonOk(items);
  } catch (error) {
    return jsonError(error);
  }
}
