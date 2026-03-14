import { z } from "zod";

export const pricingRecommendationSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  paymentMethod: z.enum(["card", "wallet", "bank_transfer"]).default("card")
});

export type PricingRecommendationInput = z.infer<typeof pricingRecommendationSchema>;
