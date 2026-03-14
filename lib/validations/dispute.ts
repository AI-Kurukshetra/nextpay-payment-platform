import { z } from "zod";

export const createDisputeSchema = z.object({
  paymentId: z.string().uuid(),
  reason: z.string().min(3).max(200),
  evidence: z.string().min(3).max(2000).optional()
});

export const updateDisputeSchema = z.object({
  status: z.enum(["open", "under_review", "won", "lost"]).optional(),
  evidence: z.string().min(3).max(2000).optional()
});

export type CreateDisputeInput = z.infer<typeof createDisputeSchema>;
export type UpdateDisputeInput = z.infer<typeof updateDisputeSchema>;
