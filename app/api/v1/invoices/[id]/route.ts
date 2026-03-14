import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { updateInvoice } from "@/lib/services/invoice-service";
import { updateInvoiceSchema } from "@/lib/validations/invoice";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await params;
    const payload = await request.json();
    const parsed = updateInvoiceSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const invoice = await updateInvoice(merchant, id, parsed.data);
    return jsonOk(invoice);
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  return PATCH(request, context);
}
