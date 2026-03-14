import type { MerchantRecord } from "@/lib/store/types";
import type { PricingRecommendationInput } from "@/lib/validations/pricing";

const paymentMethodCostBps: Record<string, number> = {
  card: 220,
  wallet: 180,
  bank_transfer: 90
};

export async function getDynamicPricingRecommendation(
  _merchant: MerchantRecord,
  input: PricingRecommendationInput
) {
  const baseCostBps = paymentMethodCostBps[input.paymentMethod] ?? 220;
  const amountRiskBps = input.amount >= 100_000 ? 45 : input.amount >= 30_000 ? 20 : 5;
  const totalCostBps = baseCostBps + amountRiskBps;

  const recommendedFee = Math.round((input.amount * totalCostBps) / 10_000);
  const recommendedDiscount =
    input.paymentMethod === "bank_transfer" ? Math.min(300, Math.round(input.amount * 0.005)) : 0;

  return {
    currency: input.currency.toUpperCase(),
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    totalCostBps,
    recommendation: {
      surchargeAmount: recommendedFee,
      discountAmount: recommendedDiscount,
      finalAmount: input.amount + recommendedFee - recommendedDiscount
    }
  };
}
