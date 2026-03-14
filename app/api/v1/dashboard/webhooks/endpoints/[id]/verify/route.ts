import { NextResponse } from "next/server";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";
import { verifyWebhookEndpoint } from "@/lib/services/webhook-service";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const result = await verifyWebhookEndpoint(merchant, id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "verification_failed" },
      { status: 400 }
    );
  }
}
