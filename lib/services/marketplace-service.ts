import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, SplitTransferRecord, SubMerchantRecord } from "@/lib/store/types";
import type {
  CreateSubMerchantInput,
  SplitExecuteInput,
  SplitPreviewInput
} from "@/lib/validations/marketplace";
import { getPaymentById } from "@/lib/services/payment-service";

export async function createSubMerchant(merchant: MerchantRecord, input: CreateSubMerchantInput) {
  const record: SubMerchantRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    name: input.name,
    email: input.email.toLowerCase(),
    status: "active",
    createdAt: new Date().toISOString()
  };
  db.subMerchants.set(record.id, record);
  return record;
}

export async function listSubMerchants(merchant: MerchantRecord) {
  return Array.from(db.subMerchants.values()).filter((item) => item.merchantId === merchant.id);
}

export async function previewPaymentSplit(merchant: MerchantRecord, input: SplitPreviewInput) {
  const payment = await getPaymentById(merchant, input.paymentId);
  const splitTotal = input.splits.reduce((sum, split) => sum + split.percentage, 0);
  if (splitTotal > 100) {
    throw new AppError(400, "split_percentage_exceeds_100");
  }

  const allocations = input.splits.map((split) => ({
    subMerchantId: split.subMerchantId,
    percentage: split.percentage,
    amount: Math.floor((payment.amount * split.percentage) / 100)
  }));

  const allocated = allocations.reduce((sum, row) => sum + row.amount, 0);
  return {
    paymentId: payment.id,
    totalAmount: payment.amount,
    currency: payment.currency,
    allocations,
    remainingAmount: payment.amount - allocated
  };
}

export async function executePaymentSplit(merchant: MerchantRecord, input: SplitExecuteInput) {
  const payment = await getPaymentById(merchant, input.paymentId);
  const totalTransfer = input.transfers.reduce((sum, row) => sum + row.amount, 0);
  if (totalTransfer > payment.amount) {
    throw new AppError(400, "transfer_exceeds_payment_amount");
  }

  const records: SplitTransferRecord[] = input.transfers.map((transfer) => {
    const subMerchant = db.subMerchants.get(transfer.subMerchantId);
    if (!subMerchant || subMerchant.merchantId !== merchant.id) {
      throw new AppError(404, "sub_merchant_not_found");
    }

    const record: SplitTransferRecord = {
      id: randomUUID(),
      merchantId: merchant.id,
      paymentId: payment.id,
      subMerchantId: transfer.subMerchantId,
      amount: transfer.amount,
      currency: input.currency.toUpperCase(),
      status: "completed",
      createdAt: new Date().toISOString()
    };
    db.splitTransfers.set(record.id, record);
    return record;
  });

  return {
    paymentId: payment.id,
    transfers: records,
    transferredTotal: totalTransfer,
    retainedAmount: payment.amount - totalTransfer
  };
}

export async function listSplitTransfers(merchant: MerchantRecord) {
  return Array.from(db.splitTransfers.values()).filter((row) => row.merchantId === merchant.id);
}
