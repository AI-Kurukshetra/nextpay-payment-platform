import { z } from "zod";

export const createCryptoQuoteSchema = z.object({
  amount: z.number().int().positive(),
  currency: z.string().length(3),
  asset: z.enum(["BTC", "ETH", "USDC"])
});

export const confirmCryptoQuoteSchema = z.object({
  walletAddress: z.string().min(12).max(160),
  txHash: z.string().min(12).max(160).optional()
});

export type CreateCryptoQuoteInput = z.infer<typeof createCryptoQuoteSchema>;
export type ConfirmCryptoQuoteInput = z.infer<typeof confirmCryptoQuoteSchema>;
