import type { MerchantRecord } from "@/lib/store/types";
import type { ListPaymentsQueryInput } from "@/lib/validations/payment";
import { listPayments } from "@/lib/services/payment-service";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
    return `"${value.replaceAll("\"", "\"\"")}"`;
  }
  return value;
}

export async function exportPaymentsCsv(merchant: MerchantRecord, filters?: ListPaymentsQueryInput) {
  const payments = await listPayments(merchant, filters);
  const header = [
    "payment_id",
    "merchant_id",
    "customer_id",
    "amount",
    "currency",
    "status",
    "risk_score",
    "created_at",
    "captured_at"
  ].join(",");

  const lines = payments.map((payment) =>
    [
      payment.id,
      payment.merchantId,
      payment.customerId ?? "",
      String(payment.amount),
      payment.currency,
      payment.status,
      String(payment.riskScore),
      payment.createdAt,
      payment.capturedAt ?? ""
    ]
      .map(csvEscape)
      .join(",")
  );

  return [header, ...lines].join("\n");
}

export async function getPaymentsReportSummary(merchant: MerchantRecord, filters?: ListPaymentsQueryInput) {
  const payments = await listPayments(merchant, filters);
  const totalVolume = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const successful = payments.filter((payment) => payment.status === "succeeded");
  const failed = payments.filter((payment) => payment.status === "failed");

  return {
    totalPayments: payments.length,
    totalVolume,
    successfulPayments: successful.length,
    failedPayments: failed.length,
    successRate: payments.length === 0 ? 0 : Number((successful.length / payments.length).toFixed(4))
  };
}
