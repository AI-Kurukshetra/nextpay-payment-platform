import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, RefundRecord } from "@/lib/store/types";
import type { RefundPaymentInput } from "@/lib/validations/payment";
import { emitWebhookEvent } from "@/lib/services/webhook-service";
import { getPaymentById, getRefundedAmount, updatePaymentStatus } from "@/lib/services/payment-service";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function fromRefundRow(row: {
  id: string;
  payment_id: string;
  merchant_id: string;
  amount: number;
  status: RefundRecord["status"];
  reason: string | null;
  created_at: string;
}): RefundRecord {
  return {
    id: row.id,
    paymentId: row.payment_id,
    merchantId: row.merchant_id,
    amount: row.amount,
    status: row.status,
    reason: row.reason,
    createdAt: row.created_at
  };
}

export async function createRefund(
  merchant: MerchantRecord,
  paymentId: string,
  input: RefundPaymentInput
) {
  const payment = await getPaymentById(merchant, paymentId);

  if (!["succeeded", "partially_refunded"].includes(payment.status)) {
    throw new AppError(409, "payment_not_refundable");
  }

  const alreadyRefunded = await getRefundedAmount(payment.id);
  const remaining = payment.amount - alreadyRefunded;

  if (input.amount > remaining) {
    throw new AppError(400, "refund_exceeds_remaining_amount");
  }

  const refundPayload = {
    id: randomUUID(),
    payment_id: payment.id,
    merchant_id: merchant.id,
    amount: input.amount,
    status: "succeeded" as const,
    reason: input.reason ?? null
  };

  let createdRefund: RefundRecord;

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("refunds")
      .insert(refundPayload)
      .select("id, payment_id, merchant_id, amount, status, reason, created_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    createdRefund = fromRefundRow(
      inserted.data as {
        id: string;
        payment_id: string;
        merchant_id: string;
        amount: number;
        status: RefundRecord["status"];
        reason: string | null;
        created_at: string;
      }
    );
  } else {
    createdRefund = {
      id: refundPayload.id,
      paymentId: refundPayload.payment_id,
      merchantId: refundPayload.merchant_id,
      amount: refundPayload.amount,
      status: refundPayload.status,
      reason: refundPayload.reason,
      createdAt: new Date().toISOString()
    };
    db.refunds.set(createdRefund.id, createdRefund);
  }

  if (input.amount === remaining) {
    await updatePaymentStatus(merchant, payment.id, "refunded");
  } else {
    await updatePaymentStatus(merchant, payment.id, "partially_refunded");
  }

  await emitWebhookEvent(merchant, {
    type: "refund.processed",
    payload: { refundId: createdRefund.id, paymentId: payment.id, amount: createdRefund.amount }
  });

  return createdRefund;
}

export async function listRefunds(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const refunds = await supabase
      .from("refunds")
      .select("id, payment_id, merchant_id, amount, status, reason, created_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (refunds.error) {
      throw new Error(refunds.error.message);
    }

    return (refunds.data as Array<{
      id: string;
      payment_id: string;
      merchant_id: string;
      amount: number;
      status: RefundRecord["status"];
      reason: string | null;
      created_at: string;
    }>).map(fromRefundRow);
  }

  return Array.from(db.refunds.values()).filter((refund) => refund.merchantId === merchant.id);
}
