import { z } from "zod";

export const updatePaymentPreferencesSchema = z.object({
  allowCard: z.boolean(),
  allowBank: z.boolean(),
  allowCrypto: z.boolean()
}).refine((value) => value.allowCard || value.allowBank || value.allowCrypto, {
  message: "At least one payment type must remain enabled."
});

export type UpdatePaymentPreferencesInput = z.infer<typeof updatePaymentPreferencesSchema>;
