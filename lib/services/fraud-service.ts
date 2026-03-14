import { randomUUID } from "node:crypto";
import { db } from "@/lib/store/database";
import type { FraudAlertRecord, FraudRuleRecord, MerchantRecord } from "@/lib/store/types";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CreateFraudRuleInput, UpdateFraudRuleInput } from "@/lib/validations/fraud-rule";

type FraudAssessmentInput = {
  merchantId: string;
  paymentId: string;
  amount: number;
  currency: string;
};

function applyCustomRules(input: FraudAssessmentInput) {
  const rules = Array.from(db.fraudRules.values()).filter(
    (rule) => rule.merchantId === input.merchantId && rule.isActive
  );

  let increment = 0;
  const hits: string[] = [];
  for (const rule of rules) {
    if (rule.currency && rule.currency.toUpperCase() !== input.currency.toUpperCase()) {
      continue;
    }
    if (rule.minAmount && input.amount < rule.minAmount) {
      continue;
    }
    if (rule.maxAmount && input.amount > rule.maxAmount) {
      continue;
    }
    increment += rule.riskScoreIncrement;
    hits.push(rule.name);
  }

  return { increment, hits };
}

function applyBehavioralModel(input: FraudAssessmentInput) {
  const merchantPayments = Array.from(db.payments.values()).filter((payment) => payment.merchantId === input.merchantId);
  if (merchantPayments.length < 5) {
    return { increment: 0, reasons: [] as string[] };
  }

  const amounts = merchantPayments.map((payment) => payment.amount);
  const avg = amounts.reduce((sum, value) => sum + value, 0) / amounts.length;
  const variance = amounts.reduce((sum, value) => sum + (value - avg) ** 2, 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  const zScore = stdDev === 0 ? 0 : (input.amount - avg) / stdDev;

  let increment = 0;
  const reasons: string[] = [];
  if (zScore >= 2.5) {
    increment += 20;
    reasons.push("ml_amount_outlier");
  }

  const recent = merchantPayments.slice(-25);
  const failureRate = recent.length
    ? recent.filter((payment) => payment.status === "failed").length / recent.length
    : 0;
  if (failureRate >= 0.25) {
    increment += 15;
    reasons.push("ml_high_recent_failure_rate");
  }

  return { increment, reasons };
}

function fromFraudRow(row: {
  id: string;
  payment_id: string;
  merchant_id: string;
  severity: "low" | "medium" | "high";
  reason: string;
  created_at: string;
}): FraudAlertRecord {
  return {
    id: row.id,
    paymentId: row.payment_id,
    merchantId: row.merchant_id,
    severity: row.severity,
    reason: row.reason,
    createdAt: row.created_at
  };
}

export async function assessFraudRisk(input: FraudAssessmentInput): Promise<{ riskScore: number }> {
  let riskScore = 0;
  const reasons: string[] = [];

  if (input.amount >= 100_000) {
    riskScore += 65;
    reasons.push("high_amount");
  }

  if (!["USD", "EUR", "INR", "GBP", "AED"].includes(input.currency.toUpperCase())) {
    riskScore += 20;
    reasons.push("uncommon_currency");
  }

  if (input.amount % 100 === 1) {
    riskScore += 10;
    reasons.push("odd_amount_pattern");
  }

  const ruleResult = applyCustomRules(input);
  if (ruleResult.increment > 0) {
    riskScore += ruleResult.increment;
    reasons.push(`rule:${ruleResult.hits.join("|")}`);
  }

  const modelResult = applyBehavioralModel(input);
  if (modelResult.increment > 0) {
    riskScore += modelResult.increment;
    reasons.push(...modelResult.reasons);
  }

  const finalScore = Math.min(riskScore, 100);

  if (finalScore >= 50) {
    const payload = {
      id: randomUUID(),
      merchant_id: input.merchantId,
      payment_id: input.paymentId,
      severity: (finalScore >= 75 ? "high" : "medium") as "medium" | "high",
      reason: reasons.join(",")
    };

    if (shouldUseSupabase()) {
      const supabase = getSupabaseAdminClient();
      const inserted = await supabase.from("fraud_alerts").insert(payload);
      if (inserted.error) {
        throw new Error(inserted.error.message);
      }
    } else {
      db.fraudAlerts.set(payload.id, {
        id: payload.id,
        merchantId: payload.merchant_id,
        paymentId: payload.payment_id,
        severity: payload.severity,
        reason: payload.reason,
        createdAt: new Date().toISOString()
      });
    }
  }

  return { riskScore: finalScore };
}

export async function createFraudRule(merchant: MerchantRecord, input: CreateFraudRuleInput) {
  const now = new Date().toISOString();
  const rule: FraudRuleRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    name: input.name,
    minAmount: input.minAmount ?? null,
    maxAmount: input.maxAmount ?? null,
    currency: input.currency?.toUpperCase() ?? null,
    riskScoreIncrement: input.riskScoreIncrement,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now
  };

  db.fraudRules.set(rule.id, rule);
  return rule;
}

export async function listFraudRules(merchant: MerchantRecord) {
  return Array.from(db.fraudRules.values())
    .filter((rule) => rule.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateFraudRule(
  merchant: MerchantRecord,
  ruleId: string,
  input: UpdateFraudRuleInput
) {
  const existing = db.fraudRules.get(ruleId);
  if (!existing || existing.merchantId !== merchant.id) {
    throw new Error("fraud_rule_not_found");
  }

  const updated: FraudRuleRecord = {
    ...existing,
    name: input.name ?? existing.name,
    minAmount: input.minAmount === undefined ? existing.minAmount : input.minAmount,
    maxAmount: input.maxAmount === undefined ? existing.maxAmount : input.maxAmount,
    currency:
      input.currency === undefined
        ? existing.currency
        : input.currency
          ? input.currency.toUpperCase()
          : null,
    riskScoreIncrement: input.riskScoreIncrement ?? existing.riskScoreIncrement,
    isActive: input.isActive ?? existing.isActive,
    updatedAt: new Date().toISOString()
  };

  db.fraudRules.set(updated.id, updated);
  return updated;
}

export async function listFraudAlerts(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const alerts = await supabase
      .from("fraud_alerts")
      .select("id, payment_id, merchant_id, severity, reason, created_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (alerts.error) {
      throw new Error(alerts.error.message);
    }

    return (alerts.data as Array<{
      id: string;
      payment_id: string;
      merchant_id: string;
      severity: "low" | "medium" | "high";
      reason: string;
      created_at: string;
    }>).map(fromFraudRow);
  }

  return Array.from(db.fraudAlerts.values()).filter((alert) => alert.merchantId === merchant.id);
}
