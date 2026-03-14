import { NextResponse } from "next/server";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";
import { listWebhookEndpoints, registerWebhookEndpoint } from "@/lib/services/webhook-service";
import { registerWebhookEndpointSchema } from "@/lib/validations/webhook";

export async function GET() {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const endpoints = await listWebhookEndpoints(merchant);
  return NextResponse.json(endpoints);
}

export async function POST(request: Request) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = registerWebhookEndpointSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const endpoint = await registerWebhookEndpoint(merchant, parsed.data);
  return NextResponse.json(endpoint, { status: 201 });
}
