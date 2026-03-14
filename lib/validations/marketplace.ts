import { z } from "zod";

export const createSubMerchantSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email()
});

export const splitPreviewSchema = z.object({
  paymentId: z.string().uuid(),
  splits: z
    .array(
      z.object({
        subMerchantId: z.string().uuid(),
        percentage: z.number().min(0).max(100)
      })
    )
    .min(1)
});

export const splitExecuteSchema = z.object({
  paymentId: z.string().uuid(),
  transfers: z
    .array(
      z.object({
        subMerchantId: z.string().uuid(),
        amount: z.number().int().positive()
      })
    )
    .min(1),
  currency: z.string().length(3)
});

export type CreateSubMerchantInput = z.infer<typeof createSubMerchantSchema>;
export type SplitPreviewInput = z.infer<typeof splitPreviewSchema>;
export type SplitExecuteInput = z.infer<typeof splitExecuteSchema>;
