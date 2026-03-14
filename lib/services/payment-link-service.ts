import { randomBytes, randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, PaymentLinkRecord } from "@/lib/store/types";
import type { CreatePaymentLinkInput } from "@/lib/validations/payment-link";
import { createPayment } from "@/lib/services/payment-service";

function generateToken() {
  return `plink_${randomBytes(12).toString("hex")}`;
}

export async function createPaymentLink(merchant: MerchantRecord, input: CreatePaymentLinkInput) {
  const record: PaymentLinkRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    token: generateToken(),
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    description: input.description ?? null,
    isActive: true,
    expiresAt: input.expiresAt ?? null,
    maxUses: input.maxUses ?? null,
    useCount: 0,
    createdAt: new Date().toISOString()
  };

  db.paymentLinks.set(record.id, record);
  return record;
}

export async function listPaymentLinks(merchant: MerchantRecord) {
  return Array.from(db.paymentLinks.values())
    .filter((link) => link.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getPaymentLinkByToken(token: string) {
  const link = Array.from(db.paymentLinks.values()).find((item) => item.token === token) ?? null;
  return link;
}

export async function createPaymentFromLink(token: string, metadata: Record<string, string> = {}) {
  const link = await getPaymentLinkByToken(token);
  if (!link || !link.isActive) {
    throw new AppError(404, "payment_link_not_found");
  }
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    throw new AppError(409, "payment_link_expired");
  }
  if (link.maxUses && link.useCount >= link.maxUses) {
    throw new AppError(409, "payment_link_usage_exhausted");
  }

  const merchant = db.merchants.get(link.merchantId);
  if (!merchant) {
    throw new AppError(404, "merchant_not_found");
  }

  const payment = await createPayment(
    merchant,
    {
      amount: link.amount,
      currency: link.currency,
      metadata: {
        ...metadata,
        source: "payment_link",
        paymentLinkToken: link.token
      }
    },
    `plink:${link.token}:${link.useCount + 1}`
  );

  link.useCount += 1;
  if (link.maxUses && link.useCount >= link.maxUses) {
    link.isActive = false;
  }
  db.paymentLinks.set(link.id, link);

  return { link, payment };
}
