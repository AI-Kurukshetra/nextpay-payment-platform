import { randomUUID } from "node:crypto";
import { providerPost } from "@/lib/integrations/provider-http";

export type ExternalPayoutProvider = "mock_bank_ach" | "mock_rtp" | "stripe_treasury" | "razorpayx";

export function choosePayoutProvider(method: "standard" | "instant"): ExternalPayoutProvider {
  const configured = process.env.NEXTPAY_PAYOUT_PROVIDER?.toLowerCase();
  if (configured === "stripe_treasury") return "stripe_treasury";
  if (configured === "razorpayx") return "razorpayx";
  return method === "instant" ? "mock_rtp" : "mock_bank_ach";
}

export async function executePayout(input: {
  provider: ExternalPayoutProvider;
  amount: number;
  currency: string;
  destination: string;
  method: "standard" | "instant";
}) {
  if (input.provider === "stripe_treasury" || input.provider === "razorpayx") {
    const baseUrl = process.env.NEXTPAY_PAYOUT_PROVIDER_URL;
    const apiKey = process.env.NEXTPAY_PAYOUT_PROVIDER_KEY;
    const result = await providerPost<
      { provider: string; amount: number; currency: string; destination: string; method: string },
      { ok: boolean; providerReference?: string; failureReason?: string }
    >(`${baseUrl}/payouts`, apiKey, {
      provider: input.provider,
      amount: input.amount,
      currency: input.currency,
      destination: input.destination,
      method: input.method
    });

    return {
      ok: Boolean(result.ok),
      providerReference: result.providerReference ?? null,
      failureReason: result.ok ? null : result.failureReason ?? "provider_rejected"
    };
  }

  const baseFailureRate = input.provider === "mock_rtp" ? 0.06 : 0.03;
  const highValuePenalty = input.amount >= 200_000 ? 0.05 : 0;
  const shouldFail = Math.random() < baseFailureRate + highValuePenalty;

  if (shouldFail) {
    return {
      ok: false as const,
      providerReference: null,
      failureReason: "provider_temporarily_unavailable"
    };
  }

  return {
    ok: true as const,
    providerReference: `${input.provider}_${randomUUID().slice(0, 12)}`,
    failureReason: null
  };
}
