import { db } from "@/lib/store/database";
import type { MerchantRecord } from "@/lib/store/types";

export async function getOptimizationRecommendations(merchant: MerchantRecord) {
  const payments = Array.from(db.payments.values()).filter((payment) => payment.merchantId === merchant.id);
  const byProcessor = new Map<string, { total: number; success: number; volume: number }>();

  for (const payment of payments) {
    const key = payment.processor;
    const row = byProcessor.get(key) ?? { total: 0, success: 0, volume: 0 };
    row.total += 1;
    row.volume += payment.amount;
    if (payment.status === "succeeded") {
      row.success += 1;
    }
    byProcessor.set(key, row);
  }

  const processorScores = Array.from(byProcessor.entries()).map(([processor, metric]) => ({
    processor,
    successRate: metric.total === 0 ? 0 : Number((metric.success / metric.total).toFixed(4)),
    avgTicket: metric.total === 0 ? 0 : Math.round(metric.volume / metric.total),
    totalTxns: metric.total
  }));

  processorScores.sort((a, b) => b.successRate - a.successRate);
  const primary = processorScores[0]?.processor ?? "stripe";
  const secondary = processorScores[1]?.processor ?? "adyen";

  return {
    generatedAt: new Date().toISOString(),
    recommendedRouting: {
      primary,
      secondary
    },
    retryPolicy: {
      maxRetries: 3,
      backoffSeconds: [30, 120, 300],
      switchProcessorOnRetry: true
    },
    processorScores
  };
}
