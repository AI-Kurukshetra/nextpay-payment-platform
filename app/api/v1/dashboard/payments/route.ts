import { NextResponse } from "next/server";
import { createPaymentSchema } from "@/lib/validations/payment";
import { createPayment } from "@/lib/services/payment-service";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";

export async function POST(request: Request) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = createPaymentSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const idempotencyKey = request.headers.get("x-idempotency-key") ?? undefined;
  const payment = await createPayment(merchant, parsed.data, idempotencyKey);

  return NextResponse.json(payment, { status: 201 });
}
