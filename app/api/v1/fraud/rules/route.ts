import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createFraudRule, listFraudRules } from "@/lib/services/fraud-service";
import { createFraudRuleSchema } from "@/lib/validations/fraud-rule";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createFraudRuleSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const rule = await createFraudRule(merchant, parsed.data);
    return jsonOk(rule, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const rules = await listFraudRules(merchant);
    return jsonOk(rules);
  } catch (error) {
    return jsonError(error);
  }
}
