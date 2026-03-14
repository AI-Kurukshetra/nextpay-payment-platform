import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createPaymentLink, listPaymentLinks } from "@/lib/services/payment-link-service";
import { createPaymentLinkSchema } from "@/lib/validations/payment-link";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createPaymentLinkSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const link = await createPaymentLink(merchant, parsed.data);
    return jsonOk(link, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const links = await listPaymentLinks(merchant);
    return jsonOk(links);
  } catch (error) {
    return jsonError(error);
  }
}
