import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { updateFraudRule } from "@/lib/services/fraud-service";
import { updateFraudRuleSchema } from "@/lib/validations/fraud-rule";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await params;
    const payload = await request.json();
    const parsed = updateFraudRuleSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const rule = await updateFraudRule(merchant, id, parsed.data);
    return jsonOk(rule);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}
