import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { confirmCryptoQuote } from "@/lib/services/crypto-service";
import { confirmCryptoQuoteSchema } from "@/lib/validations/crypto";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = (await request.json().catch(() => ({}))) as {
      quoteId?: string;
      walletAddress?: string;
      txHash?: string;
    };

    if (!payload.quoteId) {
      return jsonOk({ error: "validation_error", details: "quoteId_required" }, 400);
    }

    const parsed = confirmCryptoQuoteSchema.safeParse(payload);
    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const result = await confirmCryptoQuote(merchant, payload.quoteId, parsed.data);
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
