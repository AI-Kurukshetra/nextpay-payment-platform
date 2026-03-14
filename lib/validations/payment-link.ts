import { z } from "zod";

export const createPaymentLinkSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  description: z.string().max(200).optional(),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().positive().max(10000).optional()
});

export type CreatePaymentLinkInput = z.infer<typeof createPaymentLinkSchema>;
