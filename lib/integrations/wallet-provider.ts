import { randomBytes } from "node:crypto";
import { providerPost } from "@/lib/integrations/provider-http";

export async function authorizeWalletWithProvider(input: {
  provider: "apple_pay" | "google_pay";
  amount: number;
  currency: string;
  paymentToken?: string;
  signature?: string;
}) {
  const baseUrl = process.env.NEXTPAY_WALLET_PROVIDER_URL;
  const apiKey = process.env.NEXTPAY_WALLET_PROVIDER_KEY;

  if (baseUrl && apiKey) {
    const result = await providerPost<
      {
        provider: string;
        amount: number;
        currency: string;
        paymentToken?: string;
        signature?: string;
      },
      { ok: boolean; authToken?: string; error?: string }
    >(`${baseUrl}/wallets/authorize`, apiKey, input);

    return {
      ok: Boolean(result.ok),
      authToken: result.authToken ?? null,
      error: result.ok ? null : result.error ?? "wallet_authorization_failed"
    };
  }

  if (!input.paymentToken || input.paymentToken.length < 12) {
    return { ok: false as const, authToken: null, error: "invalid_wallet_payment_token" };
  }

  return {
    ok: true as const,
    authToken: `wlt_auth_${randomBytes(10).toString("hex")}`,
    error: null
  };
}
