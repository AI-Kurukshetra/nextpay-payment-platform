import { z } from "zod";

export const createWalletSessionSchema = z.object({
  provider: z.enum(["apple_pay", "google_pay"]),
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  customerId: z.string().uuid().optional()
});

export const authorizeWalletSessionSchema = z.object({
  paymentToken: z.string().min(12),
  signature: z.string().min(8).optional()
});

export const authenticateThreeDSSchema = z.object({
  challengeResult: z.enum(["authenticated", "failed"]),
  eci: z.string().min(1).max(8).optional(),
  dsTransactionId: z.string().min(8).max(128).optional()
});

export const initiateThreeDSSchema = z.object({
  returnUrl: z.string().url(),
  deviceChannel: z.enum(["browser", "app"]).default("browser")
});

export type CreateWalletSessionInput = z.infer<typeof createWalletSessionSchema>;
export type AuthorizeWalletSessionInput = z.infer<typeof authorizeWalletSessionSchema>;
export type AuthenticateThreeDSInput = z.infer<typeof authenticateThreeDSSchema>;
export type InitiateThreeDSInput = z.infer<typeof initiateThreeDSSchema>;
