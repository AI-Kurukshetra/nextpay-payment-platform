import { randomUUID } from "node:crypto";
import { providerPost } from "@/lib/integrations/provider-http";

export async function initiateThreeDSWithProvider(input: {
  paymentId: string;
  amount: number;
  currency: string;
  returnUrl: string;
  deviceChannel: "browser" | "app";
}) {
  const baseUrl = process.env.NEXTPAY_3DS_PROVIDER_URL;
  const apiKey = process.env.NEXTPAY_3DS_PROVIDER_KEY;

  if (baseUrl && apiKey) {
    const result = await providerPost<
      {
        paymentId: string;
        amount: number;
        currency: string;
        returnUrl: string;
        deviceChannel: "browser" | "app";
      },
      { transactionId: string; challengeUrl: string }
    >(`${baseUrl}/3ds/initiate`, apiKey, input);

    return result;
  }

  const transactionId = randomUUID();
  return {
    transactionId,
    challengeUrl: `${input.returnUrl}${input.returnUrl.includes("?") ? "&" : "?"}three_ds_txn=${transactionId}`
  };
}

export async function completeThreeDSWithProvider(input: {
  transactionId: string;
  challengeResult: "authenticated" | "failed";
  eci?: string;
  dsTransactionId?: string;
}) {
  const baseUrl = process.env.NEXTPAY_3DS_PROVIDER_URL;
  const apiKey = process.env.NEXTPAY_3DS_PROVIDER_KEY;

  if (baseUrl && apiKey) {
    const result = await providerPost<
      {
        transactionId: string;
        challengeResult: "authenticated" | "failed";
        eci?: string;
        dsTransactionId?: string;
      },
      { approved: boolean; liabilityShifted: boolean }
    >(`${baseUrl}/3ds/complete`, apiKey, input);
    return result;
  }

  return {
    approved: input.challengeResult === "authenticated",
    liabilityShifted: input.challengeResult === "authenticated"
  };
}
