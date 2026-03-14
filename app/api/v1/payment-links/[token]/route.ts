import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { assertNoSensitiveCardData } from "@/lib/security/pci";
import { createPaymentFromLink, getPaymentLinkByToken } from "@/lib/services/payment-link-service";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await enforceRateLimit();
    const { token } = await params;
    const link = await getPaymentLinkByToken(token);
    if (!link) {
      return jsonOk({ error: "payment_link_not_found" }, 404);
    }
    return jsonOk(link);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    await enforceRateLimit();
    const { token } = await params;
    const payload = (await request.json().catch(() => ({}))) as { metadata?: Record<string, string> };
    assertNoSensitiveCardData(payload.metadata ?? {});
    const result = await createPaymentFromLink(token, payload.metadata ?? {});
    return jsonOk(result, 201);
  } catch (error) {
    return jsonError(error);
  }
}
