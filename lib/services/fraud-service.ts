import { randomUUID } from "node:crypto";
import { db } from "@/lib/store/database";
import type { FraudAlertRecord, MerchantRecord } from "@/lib/store/types";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type FraudAssessmentInput = {
  merchantId: string;
  paymentId: string;
  amount: number;
  currency: string;
};

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
