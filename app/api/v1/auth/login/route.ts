import { NextResponse } from "next/server";
import { loginMerchantSchema } from "@/lib/validations/auth";
import { authenticateMerchantByApiKey } from "@/lib/services/auth-service";
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
    const parsed = loginMerchantSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "validation_error", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const merchant = await authenticateMerchantByApiKey(parsed.data.apiKey);
    if (!merchant) {
      return NextResponse.json({ error: "invalid_api_key" }, { status: 401 });
    }

    const response = NextResponse.json({
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        createdAt: merchant.createdAt
      }
    });

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
