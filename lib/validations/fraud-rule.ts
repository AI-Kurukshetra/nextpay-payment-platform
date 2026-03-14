import { z } from "zod";

export const createFraudRuleSchema = z.object({
  name: z.string().min(2).max(80),
  minAmount: z.number().int().positive().optional(),
  maxAmount: z.number().int().positive().optional(),
  currency: z.string().length(3).optional(),
  riskScoreIncrement: z.number().int().min(1).max(100),
  isActive: z.boolean().default(true)
});

export const updateFraudRuleSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  minAmount: z.number().int().positive().nullable().optional(),
  maxAmount: z.number().int().positive().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  riskScoreIncrement: z.number().int().min(1).max(100).optional(),
  isActive: z.boolean().optional()
});

export type CreateFraudRuleInput = z.infer<typeof createFraudRuleSchema>;
export type UpdateFraudRuleInput = z.infer<typeof updateFraudRuleSchema>;
