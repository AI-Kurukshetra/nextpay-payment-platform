import { randomUUID } from "node:crypto";
import { db } from "@/lib/store/database";
import type { MerchantRecord, SettlementRecord } from "@/lib/store/types";
import type { CreateSettlementInput } from "@/lib/validations/settlement";
import { convertAmountMinor } from "@/lib/services/fx-service";
import {
  choosePayoutProvider,
  executePayout
} from "@/lib/integrations/payout-provider";

export async function createSettlement(merchant: MerchantRecord, input: CreateSettlementInput) {
  const now = new Date().toISOString();
  const sourceCurrency = input.currency.toUpperCase();
  const targetCurrency = (input.settlementCurrency ?? sourceCurrency).toUpperCase();
  const converted = convertAmountMinor(input.amount, sourceCurrency, targetCurrency);
  const payoutProvider = choosePayoutProvider(input.payoutMethod);
  const feeRate = input.payoutMethod === "instant" ? 0.015 : 0.004;
  const feeAmount = Math.max(1, Math.round(converted.amount * feeRate));

  const settlement: SettlementRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    amount: input.amount,
    currency: sourceCurrency,
    settlementAmount: converted.amount,
    settlementCurrency: targetCurrency,
    fxRate: converted.fxRate,
    payoutMethod: input.payoutMethod,
    payoutProvider,
    destination: input.destination,
    feeAmount,
    failureReason: null,
    providerReference: null,
    status: "pending",
    scheduledAt: input.scheduledAt ?? now,
    processedAt: null,
    createdAt: now
  };
  db.settlements.set(settlement.id, settlement);
  return settlement;
}

export async function listSettlements(merchant: MerchantRecord) {
  return Array.from(db.settlements.values())
    .filter((settlement) => settlement.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function processSettlements(now = new Date()) {
  const due = Array.from(db.settlements.values()).filter(
    (settlement) =>
      settlement.status === "pending" &&
      new Date(settlement.scheduledAt) <= now
  );

  for (const settlement of due) {
    settlement.status = "processing";
    const execution = await executePayout({
      provider: settlement.payoutProvider,
      amount: settlement.settlementAmount - settlement.feeAmount,
      currency: settlement.settlementCurrency,
      destination: settlement.destination,
      method: settlement.payoutMethod
    });

    settlement.status = execution.ok ? "completed" : "failed";
    settlement.providerReference = execution.providerReference;
    settlement.failureReason = execution.failureReason;
    settlement.processedAt = new Date().toISOString();
    db.settlements.set(settlement.id, settlement);
  }

  return due;
}
