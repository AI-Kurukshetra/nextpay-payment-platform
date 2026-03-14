import { db } from "@/lib/store/database";
import type { MerchantRecord } from "@/lib/store/types";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function getAnalyticsOverview(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();

    const [paymentsRes, refundsRes] = await Promise.all([
      supabase
        .from("payments")
        .select("amount, status")
        .eq("merchant_id", merchant.id),
      supabase
        .from("refunds")
        .select("amount")
        .eq("merchant_id", merchant.id)
    ]);

    if (paymentsRes.error) {
      throw new Error(paymentsRes.error.message);
    }

    if (refundsRes.error) {
      throw new Error(refundsRes.error.message);
    }

    const payments = paymentsRes.data as Array<{ amount: number; status: string }>;
    const refunds = refundsRes.data as Array<{ amount: number }>;
    const succeededPayments = payments.filter((payment: { status: string }) => payment.status === "succeeded");

    const totalPaymentVolume = succeededPayments.reduce(
      (sum: number, payment: { amount: number }) => sum + Number(payment.amount),
      0
    );
    const totalRefundVolume = refunds.reduce(
      (sum: number, refund: { amount: number }) => sum + Number(refund.amount),
      0
    );

    return {
      totalPayments: payments.length,
      successfulPayments: succeededPayments.length,
      failedPayments: payments.filter((payment: { status: string }) => payment.status === "failed").length,
      totalPaymentVolume,
      totalRefundVolume,
      netVolume: totalPaymentVolume - totalRefundVolume,
      successRate: payments.length === 0 ? 0 : Number((succeededPayments.length / payments.length).toFixed(4))
    };
  }

  const payments = Array.from(db.payments.values()).filter((payment) => payment.merchantId === merchant.id);
  const refunds = Array.from(db.refunds.values()).filter((refund) => refund.merchantId === merchant.id);
  const succeededPayments = payments.filter((payment) => payment.status === "succeeded");

  const totalPaymentVolume = succeededPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const totalRefundVolume = refunds.reduce((sum, refund) => sum + refund.amount, 0);

  return {
    totalPayments: payments.length,
    successfulPayments: succeededPayments.length,
    failedPayments: payments.filter((payment) => payment.status === "failed").length,
    totalPaymentVolume,
    totalRefundVolume,
    netVolume: totalPaymentVolume - totalRefundVolume,
    successRate: payments.length === 0 ? 0 : Number((succeededPayments.length / payments.length).toFixed(4))
  };
}

export async function getPaymentMethodPerformance(merchant: MerchantRecord) {
  const payments = Array.from(db.payments.values()).filter((payment) => payment.merchantId === merchant.id);
  const byProcessor = new Map<string, { total: number; succeeded: number; volume: number }>();
  const byCurrency = new Map<string, { total: number; succeeded: number; volume: number }>();

  for (const payment of payments) {
    const processorKey = payment.processor ?? "unknown";
    const processor = byProcessor.get(processorKey) ?? { total: 0, succeeded: 0, volume: 0 };
    processor.total += 1;
    processor.volume += payment.amount;
    if (payment.status === "succeeded") processor.succeeded += 1;
    byProcessor.set(processorKey, processor);

    const currency = byCurrency.get(payment.currency) ?? { total: 0, succeeded: 0, volume: 0 };
    currency.total += 1;
    currency.volume += payment.amount;
    if (payment.status === "succeeded") currency.succeeded += 1;
    byCurrency.set(payment.currency, currency);
  }

  return {
    processors: Array.from(byProcessor.entries()).map(([name, metric]) => ({
      processor: name,
      total: metric.total,
      volume: metric.volume,
      successRate: metric.total === 0 ? 0 : Number((metric.succeeded / metric.total).toFixed(4))
    })),
    currencies: Array.from(byCurrency.entries()).map(([code, metric]) => ({
      currency: code,
      total: metric.total,
      volume: metric.volume,
      successRate: metric.total === 0 ? 0 : Number((metric.succeeded / metric.total).toFixed(4))
    }))
  };
}
