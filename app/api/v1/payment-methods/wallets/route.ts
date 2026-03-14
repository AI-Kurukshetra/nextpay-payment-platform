import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createWalletSession, listWalletSessions } from "@/lib/services/wallet-service";
import { createWalletSessionSchema } from "@/lib/validations/wallet";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createWalletSessionSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const session = await createWalletSession(merchant, parsed.data);
    return jsonOk(session, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const sessions = await listWalletSessions(merchant);
    return jsonOk(sessions);
  } catch (error) {
    return jsonError(error);
  }
}
