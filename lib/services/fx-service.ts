import { createHash } from "node:crypto";
import { getSupportedCurrencies } from "@/lib/services/currency-catalog";

const BASE_CURRENCY = "USD";

function normalizeCurrency(currency: string) {
  return currency.trim().toUpperCase();
}

export function isSupportedCurrency(currency: string) {
  return getSupportedCurrencies().includes(normalizeCurrency(currency));
}

function syntheticUsdRate(currency: string) {
  if (currency === BASE_CURRENCY) {
    return 1;
  }

  // Deterministic mock FX rate for broad currency coverage in sandbox/dev.
  const digest = createHash("sha256").update(currency).digest();
  const raw = digest[0] ?? 1;
  return Number((0.2 + (raw / 255) * 120).toFixed(6));
}

export function convertAmountMinor(
  amountMinor: number,
  fromCurrency: string,
  toCurrency: string
) {
  const from = normalizeCurrency(fromCurrency);
  const to = normalizeCurrency(toCurrency);

  const fromRate = syntheticUsdRate(from);
  const toRate = syntheticUsdRate(to);

  if (!fromRate || !toRate) {
    throw new Error("unsupported_currency_conversion");
  }

  const amountInUsd = amountMinor / fromRate;
  const converted = Math.round(amountInUsd * toRate);
  const fxRate = Number((toRate / fromRate).toFixed(8));

  return {
    amount: converted,
    fxRate,
    baseCurrency: BASE_CURRENCY
  };
}
