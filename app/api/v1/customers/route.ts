import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { createCustomer, listCustomers } from "@/lib/services/customer-service";
import { createCustomerSchema } from "@/lib/validations/customer";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = await request.json();
    const parsed = createCustomerSchema.safeParse(payload);

    if (!parsed.success) {
      return jsonOk({ error: "validation_error", details: parsed.error.flatten() }, 400);
    }

    const customer = await createCustomer(merchant, parsed.data);
    return jsonOk(customer, 201);
  } catch (error) {
    return jsonError(error);
  }
}

export async function GET() {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const customers = await listCustomers(merchant);
    return jsonOk(customers);
  } catch (error) {
    return jsonError(error);
  }
}
