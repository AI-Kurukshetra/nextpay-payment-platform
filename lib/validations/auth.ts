import { z } from "zod";

export const registerMerchantSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});

export const loginMerchantSchema = z.object({
  apiKey: z.string().startsWith("np_live_")
});

export const rotateApiKeySchema = z.object({
  label: z.string().min(2).max(40).optional(),
  reason: z.string().min(3).max(200).optional()
});

export const revokeApiKeySchema = z.object({
  apiKey: z.string().startsWith("np_live_"),
  reason: z.string().min(3).max(200).optional()
});

export type RegisterMerchantInput = z.infer<typeof registerMerchantSchema>;
export type LoginMerchantInput = z.infer<typeof loginMerchantSchema>;
export type RotateApiKeyInput = z.infer<typeof rotateApiKeySchema>;
export type RevokeApiKeyInput = z.infer<typeof revokeApiKeySchema>;
