import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, PaymentRecord } from "@/lib/store/types";
import type { CreatePaymentInput } from "@/lib/validations/payment";
import { assessFraudRisk } from "@/lib/services/fraud-service";
import { emitWebhookEvent } from "@/lib/services/webhook-service";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function fromPaymentRow(row: {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  amount: number;
  currency: string;
  status: PaymentRecord["status"];
  risk_score: number;
  metadata: Record<string, string>;
  created_at: string;
  captured_at: string | null;
}): PaymentRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    customerId: row.customer_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    riskScore: row.risk_score,
    metadata: row.metadata,
    createdAt: row.created_at,
    capturedAt: row.captured_at
  };
}

export async function createPayment(
  merchant: MerchantRecord,
  input: CreatePaymentInput,
  idempotencyKey?: string
): Promise<PaymentRecord> {
  if (idempotencyKey) {
    if (shouldUseSupabase()) {
      const supabase = getSupabaseAdminClient();
      const existing = await supabase
        .from("payments")
        .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
        .eq("merchant_id", merchant.id)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing.error) {
        throw new Error(existing.error.message);
      }

      if (existing.data) {
        return fromPaymentRow(
          existing.data as {
            id: string;
            merchant_id: string;
            customer_id: string | null;
            amount: number;
            currency: string;
            status: PaymentRecord["status"];
            risk_score: number;
            metadata: Record<string, string>;
            created_at: string;
            captured_at: string | null;
          }
        );
      }
    } else {
      const existing = Array.from(db.payments.values()).find(
        (payment) =>
          payment.merchantId === merchant.id && payment.metadata.idempotencyKey === idempotencyKey
      );
      if (existing) {
        return existing;
      }
    }
  }

  const paymentId = randomUUID();
  const fraud = await assessFraudRisk({
    merchantId: merchant.id,
    paymentId,
    amount: input.amount,
    currency: input.currency
  });

  const payment: PaymentRecord = {
    id: paymentId,
    merchantId: merchant.id,
    customerId: input.customerId ?? null,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    status: fraud.riskScore >= 90 ? "failed" : "authorized",
    riskScore: fraud.riskScore,
    metadata: idempotencyKey
      ? { ...input.metadata, idempotencyKey }
      : input.metadata,
    createdAt: new Date().toISOString(),
    capturedAt: null
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("payments")
      .insert({
        id: payment.id,
        merchant_id: payment.merchantId,
        customer_id: payment.customerId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        risk_score: payment.riskScore,
        metadata: payment.metadata,
        captured_at: payment.capturedAt,
        idempotency_key: idempotencyKey ?? null
      })
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    await emitWebhookEvent(merchant, {
      type: payment.status === "failed" ? "payment.failed" : "payment.authorized",
      payload: { paymentId: payment.id, amount: payment.amount, currency: payment.currency }
    });

    return fromPaymentRow(
      inserted.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  db.payments.set(payment.id, payment);
  await emitWebhookEvent(merchant, {
    type: payment.status === "failed" ? "payment.failed" : "payment.authorized",
    payload: { paymentId: payment.id, amount: payment.amount, currency: payment.currency }
  });

  return payment;
}

export async function getPaymentById(merchant: MerchantRecord, paymentId: string): Promise<PaymentRecord> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const payment = await supabase
      .from("payments")
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .eq("merchant_id", merchant.id)
      .eq("id", paymentId)
      .maybeSingle();

    if (payment.error) {
      throw new Error(payment.error.message);
    }

    if (!payment.data) {
      throw new AppError(404, "payment_not_found");
    }

    return fromPaymentRow(
      payment.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  const payment = db.payments.get(paymentId);
  if (!payment || payment.merchantId !== merchant.id) {
    throw new AppError(404, "payment_not_found");
  }

  return payment;
}

export async function capturePayment(merchant: MerchantRecord, paymentId: string): Promise<PaymentRecord> {
  const payment = await getPaymentById(merchant, paymentId);

  if (payment.status !== "authorized") {
    throw new AppError(409, "payment_not_authorized");
  }

  const capturedAt = new Date().toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updated = await supabase
      .from("payments")
      .update({ status: "succeeded", captured_at: capturedAt })
      .eq("id", payment.id)
      .eq("merchant_id", merchant.id)
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    await emitWebhookEvent(merchant, {
      type: "payment.succeeded",
      payload: { paymentId: payment.id }
    });

    return fromPaymentRow(
      updated.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  payment.status = "succeeded";
  payment.capturedAt = capturedAt;
  db.payments.set(payment.id, payment);

  await emitWebhookEvent(merchant, {
    type: "payment.succeeded",
    payload: { paymentId: payment.id }
  });

  return payment;
}

export async function listPayments(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const payments = await supabase
      .from("payments")
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (payments.error) {
      throw new Error(payments.error.message);
    }

    return (payments.data as Array<{
      id: string;
      merchant_id: string;
      customer_id: string | null;
      amount: number;
      currency: string;
      status: PaymentRecord["status"];
      risk_score: number;
      metadata: Record<string, string>;
      created_at: string;
      captured_at: string | null;
    }>).map(fromPaymentRow);
  }

  return Array.from(db.payments.values()).filter((payment) => payment.merchantId === merchant.id);
}

export async function updatePaymentStatus(
  merchant: MerchantRecord,
  paymentId: string,
  status: PaymentRecord["status"]
) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updated = await supabase
      .from("payments")
      .update({ status })
      .eq("id", paymentId)
      .eq("merchant_id", merchant.id)
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    return fromPaymentRow(
      updated.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  const payment = await getPaymentById(merchant, paymentId);
  payment.status = status;
  db.payments.set(payment.id, payment);
  return payment;
}

export async function getRefundedAmount(paymentId: string) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const refunds = await supabase
      .from("refunds")
      .select("amount")
      .eq("payment_id", paymentId)
      .eq("status", "succeeded");

    if (refunds.error) {
      throw new Error(refunds.error.message);
    }

    return (refunds.data as Array<{ amount: number }>).reduce(
      (sum: number, refund: { amount: number }) => sum + Number(refund.amount),
      0
    );
  }

  return Array.from(db.refunds.values())
    .filter((refund) => refund.paymentId === paymentId && refund.status === "succeeded")
    .reduce((sum, refund) => sum + refund.amount, 0);
}
