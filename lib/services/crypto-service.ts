import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { CryptoQuoteRecord, MerchantRecord } from "@/lib/store/types";
import type { ConfirmCryptoQuoteInput, CreateCryptoQuoteInput } from "@/lib/validations/crypto";
import { createPayment } from "@/lib/services/payment-service";

const usdAssetRates: Record<"BTC" | "ETH" | "USDC", number> = {
  BTC: 68_500,
  ETH: 3_650,
  USDC: 1
};

function fiatToUsd(amountMinor: number, currency: string) {
  const code = currency.toUpperCase();
  const rates: Record<string, number> = { USD: 1, EUR: 1.08, GBP: 1.27, INR: 0.012, AED: 0.272 };
  return (amountMinor / 100) * (rates[code] ?? 1);
}

export async function createCryptoQuote(merchant: MerchantRecord, input: CreateCryptoQuoteInput) {
  const usdAmount = fiatToUsd(input.amount, input.currency);
  const rate = usdAssetRates[input.asset];
  const assetAmount = (usdAmount / rate).toFixed(input.asset === "USDC" ? 2 : 8);

  const quote: CryptoQuoteRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    fiatAmount: input.amount,
    fiatCurrency: input.currency.toUpperCase(),
    asset: input.asset,
    assetAmount,
    rate,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString()
  };
  db.cryptoQuotes.set(quote.id, quote);
  return quote;
}

export async function confirmCryptoQuote(
  merchant: MerchantRecord,
  quoteId: string,
  input: ConfirmCryptoQuoteInput
) {
  const quote = db.cryptoQuotes.get(quoteId);
  if (!quote || quote.merchantId !== merchant.id) {
    throw new AppError(404, "crypto_quote_not_found");
  }
  if (new Date(quote.expiresAt).getTime() <= Date.now()) {
    throw new AppError(409, "crypto_quote_expired");
  }

  const payment = await createPayment(merchant, {
    amount: quote.fiatAmount,
    currency: quote.fiatCurrency,
    metadata: {
      source: "crypto_payment",
      asset: quote.asset,
      assetAmount: quote.assetAmount,
      walletAddress: input.walletAddress,
      txHash: input.txHash ?? ""
    }
  });

  return {
    quoteId: quote.id,
    paymentId: payment.id,
    status: "accepted",
    chainSettlement: {
      asset: quote.asset,
      amount: quote.assetAmount
    }
  };
}
