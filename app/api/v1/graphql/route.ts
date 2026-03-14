import { requireMerchant } from "@/lib/api/auth";
import { jsonError, jsonOk } from "@/lib/api/http";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { executeGraphQL } from "@/lib/services/graphql-service";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const merchant = await requireMerchant();
    const payload = (await request.json().catch(() => ({}))) as {
      query?: string;
      variables?: Record<string, string | number | boolean | undefined>;
    };

    if (!payload.query || payload.query.trim().length === 0) {
      return jsonOk({ error: "validation_error", details: "query_required" }, 400);
    }

    const result = await executeGraphQL(merchant, {
      query: payload.query,
      variables: payload.variables
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error);
  }
}
