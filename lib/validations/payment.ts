import { z } from "zod";

export const createPaymentSchema = z.object({
  customerId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  metadata: z.record(z.string()).default({})
});

export const capturePaymentSchema = z.object({
  confirm: z.literal(true)
});

export const refundPaymentSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().min(3).max(200).optional()
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
export type RefundPaymentInput = z.infer<typeof refundPaymentSchema>;
