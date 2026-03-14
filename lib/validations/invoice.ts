import { z } from "zod";

export const createInvoiceSchema = z.object({
  customerId: z.string().uuid(),
  subscriptionId: z.string().uuid().optional(),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  dueAt: z.string().datetime().optional()
});

export const updateInvoiceSchema = z.object({
  status: z.enum(["draft", "open", "paid", "void"]).optional()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
