import { z } from "zod";

export const createSubscriptionPlanSchema = z.object({
  name: z.string().min(2),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  interval: z.enum(["month", "year"]),
  trialDays: z.number().int().min(0).max(90).default(0)
});

export const createSubscriptionSchema = z.object({
  customerId: z.string().uuid(),
  planId: z.string().uuid()
});

export type CreateSubscriptionPlanInput = z.infer<typeof createSubscriptionPlanSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
