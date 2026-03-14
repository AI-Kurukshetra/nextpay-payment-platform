import { z } from "zod";

export const createSettlementSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  settlementCurrency: z.string().length(3).optional(),
  payoutMethod: z.enum(["standard", "instant"]).default("standard"),
  destination: z.string().min(6).max(120),
  scheduledAt: z.string().datetime().optional()
});

export type CreateSettlementInput = z.infer<typeof createSettlementSchema>;
