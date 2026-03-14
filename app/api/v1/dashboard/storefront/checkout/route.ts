import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";
import { createPayment } from "@/lib/services/payment-service";
import { STOREFRONT_PRODUCTS } from "@/lib/storefront/catalog";

const storefrontCheckoutSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).max(20).default(1),
  buyerName: z.string().min(2).max(80),
  buyerEmail: z.string().email(),
  routingMode: z.enum(["auto", "manual"]).default("auto"),
  routeType: z.enum(["card", "bank", "crypto"]).default("card"),
  preferredProcessor: z
    .enum(["stripe", "adyen", "razorpay", "bank_gateway", "crypto_processor"])
    .optional()
});

export async function POST(request: Request) {
  const merchant = await getDashboardSessionMerchant();
  if (!merchant) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = storefrontCheckoutSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_error", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const product = STOREFRONT_PRODUCTS.find((item) => item.id === parsed.data.productId);
  if (!product) {
    return NextResponse.json({ error: "product_not_found" }, { status: 404 });
  }

  const amount = product.amount * parsed.data.quantity;
  const payment = await createPayment(
    merchant,
    {
      amount,
      currency: product.currency,
      routingMode: parsed.data.routingMode,
      routeType: parsed.data.routeType,
      preferredProcessor: parsed.data.preferredProcessor,
      metadata: {
        source: "demo_storefront",
        productId: product.id,
        productName: product.name,
        quantity: String(parsed.data.quantity),
        buyerName: parsed.data.buyerName,
        buyerEmail: parsed.data.buyerEmail
      }
    },
    `storefront:${merchant.id}:${randomUUID()}`
  );

  return NextResponse.json(
    {
      paymentId: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      processor: payment.processor
    },
    { status: 201 }
  );
}
