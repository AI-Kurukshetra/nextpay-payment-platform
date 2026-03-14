import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { getCustomerById } from "@/lib/services/customer-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const { id } = await context.params;
    const customer = await getCustomerById(merchant, id);
    return jsonOk(customer);
  } catch (error) {
    return jsonError(error);
  }
}
