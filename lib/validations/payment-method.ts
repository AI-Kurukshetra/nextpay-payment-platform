import { z } from "zod";

export const createPaymentMethodSchema = z.object({
  customerId: z.string().uuid(),
  cardNumber: z.string().regex(/^\d{16}$/),
  expMonth: z.number().int().min(1).max(12),
  expYear: z.number().int().min(new Date().getFullYear()),
  brand: z.string().min(2).max(20).default("visa")
});

export type CreatePaymentMethodInput = z.infer<typeof createPaymentMethodSchema>;
