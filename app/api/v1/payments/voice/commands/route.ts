import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { executeVoicePaymentCommand } from "@/lib/services/voice-command-service";
import { voicePaymentCommandSchema } from "@/lib/validations/voice";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = voicePaymentCommandSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const result = await executeVoicePaymentCommand(merchant, parsed.data);
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
