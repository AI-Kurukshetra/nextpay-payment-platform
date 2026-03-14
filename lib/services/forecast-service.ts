import { db } from "@/lib/store/database";
import type { MerchantRecord } from "@/lib/store/types";

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
}

export async function forecastCashflow(merchant: MerchantRecord, horizonDays = 14) {
  const payments = Array.from(db.payments.values())
    .filter((payment) => payment.merchantId === merchant.id && payment.status === "succeeded")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const byDay = new Map<string, number>();
  for (const payment of payments) {
    const day = startOfDay(new Date(payment.createdAt));
    byDay.set(day, (byDay.get(day) ?? 0) + payment.amount);
  }

  const history = Array.from(byDay.entries())
    .map(([day, volume]) => ({ day, volume }))
    .sort((a, b) => a.day.localeCompare(b.day));
  const recent = history.slice(-30);
  const avgDaily = recent.length
    ? Math.round(recent.reduce((sum, row) => sum + row.volume, 0) / recent.length)
    : 0;

  const forecast = Array.from({ length: horizonDays }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index + 1);
    const weekdayBoost = [5, 6].includes(date.getDay()) ? 0.85 : 1.05;
    return {
      day: startOfDay(date),
      predictedVolume: Math.round(avgDaily * weekdayBoost)
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    horizonDays,
    averageDailyVolume: avgDaily,
    history: recent,
    forecast
  };
}
