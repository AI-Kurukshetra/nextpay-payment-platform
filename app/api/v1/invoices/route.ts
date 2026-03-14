import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createInvoice, listInvoices } from "@/lib/services/invoice-service";
import { createInvoiceSchema } from "@/lib/validations/invoice";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createInvoiceSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const invoice = await createInvoice(merchant, parsed.data);
    return jsonOk(invoice, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const invoices = await listInvoices(merchant);
    return jsonOk(invoices);
  } catch (error) {
    return jsonError(error);
  }
}
