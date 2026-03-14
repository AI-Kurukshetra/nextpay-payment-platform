import { NextResponse } from "next/server";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";
import {
  getMerchantPaymentPreferences,
  updateMerchantPaymentPreferences
} from "@/lib/services/payment-preferences-service";
import { updatePaymentPreferencesSchema } from "@/lib/validations/payment-preferences";

export async function GET() {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const settings = await getMerchantPaymentPreferences(merchant);
  return NextResponse.json(settings);
}

export async function PATCH(request: Request) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = updatePaymentPreferencesSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const settings = await updateMerchantPaymentPreferences(merchant, parsed.data);
  return NextResponse.json(settings);
}
