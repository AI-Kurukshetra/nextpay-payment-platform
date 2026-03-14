import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { DisputeRecord, MerchantRecord } from "@/lib/store/types";
import type { CreateDisputeInput, UpdateDisputeInput } from "@/lib/validations/dispute";
import { getPaymentById } from "@/lib/services/payment-service";

export async function createDispute(merchant: MerchantRecord, input: CreateDisputeInput) {
  const payment = await getPaymentById(merchant, input.paymentId);
  if (!["succeeded", "partially_refunded", "refunded"].includes(payment.status)) {
    throw new AppError(409, "payment_not_disputable");
  }

  const now = new Date().toISOString();
  const dispute: DisputeRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    paymentId: payment.id,
    reason: input.reason,
    amount: payment.amount,
    status: "open",
    evidence: input.evidence ?? null,
    createdAt: now,
    updatedAt: now
  };

  db.disputes.set(dispute.id, dispute);
  return dispute;
}

export async function listDisputes(merchant: MerchantRecord) {
  return Array.from(db.disputes.values())
    .filter((dispute) => dispute.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getDisputeById(merchant: MerchantRecord, disputeId: string) {
  const dispute = db.disputes.get(disputeId);
  if (!dispute || dispute.merchantId !== merchant.id) {
    throw new AppError(404, "dispute_not_found");
  }
  return dispute;
}

export async function updateDispute(
  merchant: MerchantRecord,
  disputeId: string,
  input: UpdateDisputeInput
) {
  const dispute = await getDisputeById(merchant, disputeId);
  const updated: DisputeRecord = {
    ...dispute,
    status: input.status ?? dispute.status,
    evidence: input.evidence ?? dispute.evidence,
    updatedAt: new Date().toISOString()
  };
  db.disputes.set(updated.id, updated);
  return updated;
}
