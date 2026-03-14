import { createHash, randomBytes, randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, PaymentMethodRecord } from "@/lib/store/types";
import type { CreatePaymentMethodInput } from "@/lib/validations/payment-method";

function tokenizeCard(last4: string) {
  return `pm_tok_${last4}_${randomBytes(8).toString("hex")}`;
}

function luhnCheck(number: string) {
  let sum = 0;
  let doubleDigit = false;
  for (let i = number.length - 1; i >= 0; i -= 1) {
    let digit = Number(number[i]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}

export async function createPaymentMethod(merchant: MerchantRecord, input: CreatePaymentMethodInput) {
  if (!luhnCheck(input.cardNumber)) {
    throw new AppError(400, "invalid_card_number");
  }

  const last4 = input.cardNumber.slice(-4);
  const fingerprint = createHash("sha256")
    .update(`${merchant.id}:${input.cardNumber}`)
    .digest("hex")
    .slice(0, 24);
  const method: PaymentMethodRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    customerId: input.customerId,
    type: "card",
    brand: input.brand.toLowerCase(),
    last4,
    expMonth: input.expMonth,
    expYear: input.expYear,
    token: tokenizeCard(last4),
    fingerprint,
    createdAt: new Date().toISOString()
  };
  db.paymentMethods.set(method.id, method);
  return method;
}

export async function listPaymentMethods(merchant: MerchantRecord, customerId?: string) {
  return Array.from(db.paymentMethods.values()).filter(
    (method) =>
      method.merchantId === merchant.id &&
      (customerId ? method.customerId === customerId : true)
  );
}
