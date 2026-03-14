import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createCryptoQuote } from "@/lib/services/crypto-service";
import { createCryptoQuoteSchema } from "@/lib/validations/crypto";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createCryptoQuoteSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const quote = await createCryptoQuote(merchant, parsed.data);
    return jsonOk(quote, 201);
  } catch (error) {
    return jsonError(error);
  }
}
