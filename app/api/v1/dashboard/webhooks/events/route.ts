import { NextResponse } from "next/server";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";
import { emitWebhookEvent } from "@/lib/services/webhook-service";
import { emitWebhookEventSchema } from "@/lib/validations/webhook";

export async function POST(request: Request) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = emitWebhookEventSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const event = await emitWebhookEvent(merchant, parsed.data);
  return NextResponse.json(event, { status: 201 });
}
