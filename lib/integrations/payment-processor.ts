import { providerPost } from "@/lib/integrations/provider-http";
import type { Processor } from "@/lib/services/payment-router-service";

export async function authorizePaymentWithProcessor(input: {
  processor: Processor;
  amount: number;
  currency: string;
  merchantId: string;
  paymentId: string;
}) {
  if (process.env.NODE_ENV === "test") {
    return {
      approved: true,
      providerPaymentId: `${input.processor}_${input.paymentId.slice(0, 12)}`,
      declineReason: null
    };
  }

  const baseUrl = process.env.NEXTPAY_PROCESSOR_PROVIDER_URL;
  const apiKey = process.env.NEXTPAY_PROCESSOR_PROVIDER_KEY;

  if (baseUrl && apiKey) {
    const result = await providerPost<
      {
        processor: string;
        amount: number;
        currency: string;
        merchantId: string;
        paymentId: string;
      },
      { approved: boolean; providerPaymentId: string | null; declineReason: string | null }
    >(`${baseUrl}/processors/authorize`, apiKey, {
      processor: input.processor,
      amount: input.amount,
      currency: input.currency,
      merchantId: input.merchantId,
      paymentId: input.paymentId
    });

    return result;
  }

  const defaultSuccessRate: Record<Processor, number> = {
    stripe: 0.96,
    adyen: 0.95,
    razorpay: input.currency.toUpperCase() === "INR" ? 0.97 : 0.9,
    bank_gateway: 0.92,
    crypto_processor: 0.89
  };

  let successRate = defaultSuccessRate[input.processor] ?? 0.9;
  if (input.amount >= 120_000) {
    successRate -= 0.05;
  }

  const approved = Math.random() < successRate;
  return {
    approved,
    providerPaymentId: approved ? `${input.processor}_${input.paymentId.slice(0, 12)}` : null,
    declineReason: approved ? null : "issuer_declined"
  };
}
