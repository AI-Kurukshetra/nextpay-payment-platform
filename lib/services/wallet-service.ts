import { randomBytes, randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, WalletSessionRecord } from "@/lib/store/types";
import type { AuthorizeWalletSessionInput, CreateWalletSessionInput } from "@/lib/validations/wallet";
import { createPayment } from "@/lib/services/payment-service";
import { authorizeWalletWithProvider } from "@/lib/integrations/wallet-provider";

export async function createWalletSession(merchant: MerchantRecord, input: CreateWalletSessionInput) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const record: WalletSessionRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    customerId: input.customerId ?? null,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    provider: input.provider,
    status: "created",
    clientSecret: `wlt_${randomBytes(16).toString("hex")}`,
    providerSessionId: `${input.provider}_${randomUUID().slice(0, 12)}`,
    authToken: null,
    paymentId: null,
    expiresAt,
    createdAt: new Date().toISOString()
  };
  db.walletSessions.set(record.id, record);
  return record;
}

export async function authorizeWalletSession(
  merchant: MerchantRecord,
  sessionId: string,
  payload: AuthorizeWalletSessionInput
) {
  const session = db.walletSessions.get(sessionId);
  if (!session || session.merchantId !== merchant.id) {
    throw new AppError(404, "wallet_session_not_found");
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    session.status = "expired";
    db.walletSessions.set(session.id, session);
    throw new AppError(409, "wallet_session_expired");
  }

  const providerResult = await authorizeWalletWithProvider({
    provider: session.provider,
    amount: session.amount,
    currency: session.currency,
    paymentToken: payload.paymentToken,
    signature: payload.signature
  });
  if (!providerResult.ok || !providerResult.authToken) {
    throw new AppError(402, providerResult.error ?? "wallet_authorization_failed");
  }

  const payment = await createPayment(merchant, {
    customerId: session.customerId ?? undefined,
    amount: session.amount,
    currency: session.currency,
    metadata: {
      source: "wallet_session",
      provider: session.provider,
      walletSessionId: session.id,
      providerSessionId: session.providerSessionId
    }
  });

  session.status = "authorized";
  session.authToken = providerResult.authToken;
  session.paymentId = payment.id;
  db.walletSessions.set(session.id, session);
  return { ...session, paymentId: payment.id };
}

export async function listWalletSessions(merchant: MerchantRecord) {
  return Array.from(db.walletSessions.values()).filter((session) => session.merchantId === merchant.id);
}
