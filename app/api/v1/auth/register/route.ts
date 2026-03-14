import { NextResponse } from "next/server";
import { registerMerchantSchema } from "@/lib/validations/auth";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { enforceRateLimit } from "@/lib/api/route-guard";
import { jsonError } from "@/lib/api/http";
import {
  createDashboardSessionToken,
  DASHBOARD_SESSION_COOKIE,
  getDashboardSessionCookieOptions
} from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    await enforceRateLimit();
    const payload = await request.json();
    const parsed = registerMerchantSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const result = await registerMerchant(parsed.data);
    const merchant = await authenticateMerchantByApiKey(result.apiKey);
    if (!merchant) {
      return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
    }

    const response = NextResponse.json(result, { status: 201 });
    response.cookies.set({
      name: DASHBOARD_SESSION_COOKIE,
      value: createDashboardSessionToken({
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        apiKeyHash: merchant.apiKeyHash,
        createdAt: merchant.createdAt
      }),
      ...getDashboardSessionCookieOptions()
    });

    return response;
  } catch (error) {
    return jsonError(error);
  }
}
