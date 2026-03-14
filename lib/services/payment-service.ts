import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, PaymentRecord } from "@/lib/store/types";
import type { CreatePaymentInput, ListPaymentsQueryInput } from "@/lib/validations/payment";
import { assessFraudRisk } from "@/lib/services/fraud-service";
import { emitWebhookEvent } from "@/lib/services/webhook-service";
import { convertAmountMinor, isSupportedCurrency } from "@/lib/services/fx-service";
import { routePaymentDecision } from "@/lib/services/payment-router-service";
import { completeThreeDSWithProvider, initiateThreeDSWithProvider } from "@/lib/integrations/three-ds-provider";
import { authorizePaymentWithProcessor } from "@/lib/integrations/payment-processor";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getMerchantPaymentPreferences } from "@/lib/services/payment-preferences-service";

function fromPaymentRow(row: {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  amount: number;
  currency: string;
  status: PaymentRecord["status"];
  risk_score: number;
  metadata: Record<string, string>;
  created_at: string;
  captured_at: string | null;
}): PaymentRecord {
  const settlementCurrency =
    typeof row.metadata.settlementCurrency === "string" ? row.metadata.settlementCurrency : row.currency;
  const settlementAmount =
    typeof row.metadata.settlementAmount === "string"
      ? Number(row.metadata.settlementAmount)
      : row.amount;
  const fxRate = typeof row.metadata.fxRate === "string" ? Number(row.metadata.fxRate) : 1;
  const processor = (row.metadata.processor as PaymentRecord["processor"] | undefined) ?? "stripe";

  return {
    id: row.id,
    merchantId: row.merchant_id,
    customerId: row.customer_id,
    amount: row.amount,
    currency: row.currency,
    status: row.status,
    riskScore: row.risk_score,
    processor,
    settlementCurrency,
    settlementAmount,
    fxRate,
    metadata: row.metadata,
    createdAt: row.created_at,
    capturedAt: row.captured_at
  };
}

export async function createPayment(
  merchant: MerchantRecord,
  input: CreatePaymentInput,
  idempotencyKey?: string
): Promise<PaymentRecord> {
  const requestedRouteType = input.routeType ?? "card";
  const preferences = await getMerchantPaymentPreferences(merchant);
  const isAllowed =
    (requestedRouteType === "card" && preferences.allowCard) ||
    (requestedRouteType === "bank" && preferences.allowBank) ||
    (requestedRouteType === "crypto" && preferences.allowCrypto);
  if (!isAllowed) {
    throw new AppError(403, "payment_type_not_allowed");
  }

  const paymentCurrency = input.currency.toUpperCase();
  const settlementCurrency = (input.settlementCurrency ?? paymentCurrency).toUpperCase();
  if (!isSupportedCurrency(paymentCurrency) || !isSupportedCurrency(settlementCurrency)) {
    throw new AppError(400, "unsupported_currency");
  }

  const conversion = convertAmountMinor(input.amount, paymentCurrency, settlementCurrency);
  const decision = routePaymentDecision({
    amount: input.amount,
    currency: paymentCurrency,
    routingMode: input.routingMode,
    routeType: input.routeType,
    preferredProcessor: input.preferredProcessor
  });
  const processor = decision.processor;

  if (idempotencyKey) {
    if (shouldUseSupabase()) {
      const supabase = getSupabaseAdminClient();
      const existing = await supabase
        .from("payments")
        .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
        .eq("merchant_id", merchant.id)
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing.error) {
        throw new Error(existing.error.message);
      }

      if (existing.data) {
        return fromPaymentRow(
          existing.data as {
            id: string;
            merchant_id: string;
            customer_id: string | null;
            amount: number;
            currency: string;
            status: PaymentRecord["status"];
            risk_score: number;
            metadata: Record<string, string>;
            created_at: string;
            captured_at: string | null;
          }
        );
      }
    } else {
      const existing = Array.from(db.payments.values()).find(
        (payment) =>
          payment.merchantId === merchant.id && payment.metadata.idempotencyKey === idempotencyKey
      );
      if (existing) {
        return existing;
      }
    }
  }

  const paymentId = randomUUID();
  const fraud = await assessFraudRisk({
    merchantId: merchant.id,
    paymentId,
    amount: input.amount,
    currency: paymentCurrency
  });
  const requires3ds = input.require3ds ?? false;
  const isFraudRejected = fraud.riskScore >= 90;
  const initialStatus = isFraudRejected ? "failed" : requires3ds ? "requires_action" : "authorized";
  const processorAuth =
    initialStatus === "authorized"
      ? await authorizePaymentWithProcessor({
          processor,
          amount: input.amount,
          currency: paymentCurrency,
          merchantId: merchant.id,
          paymentId
        })
      : null;
  const finalStatus =
    initialStatus === "authorized" && processorAuth && !processorAuth.approved
      ? "failed"
      : initialStatus;

  const payment: PaymentRecord = {
    id: paymentId,
    merchantId: merchant.id,
    customerId: input.customerId ?? null,
    amount: input.amount,
    currency: paymentCurrency,
    status: finalStatus,
    riskScore: fraud.riskScore,
    processor,
    settlementCurrency,
    settlementAmount: conversion.amount,
    fxRate: conversion.fxRate,
    metadata: idempotencyKey
      ? {
          ...input.metadata,
          idempotencyKey,
          processor,
          routingMode: input.routingMode ?? "auto",
          routeType: input.routeType ?? "card",
          preferredProcessor: input.preferredProcessor ?? "",
          routingReason: decision.reason,
          routingCandidates: JSON.stringify(decision.candidates),
          settlementCurrency,
          settlementAmount: String(conversion.amount),
          fxRate: String(conversion.fxRate),
          baseCurrency: conversion.baseCurrency,
          processorPaymentId: processorAuth?.providerPaymentId ?? "",
          processorDeclineReason: processorAuth?.declineReason ?? ""
        }
      : {
          ...input.metadata,
          processor,
          routingMode: input.routingMode ?? "auto",
          routeType: input.routeType ?? "card",
          preferredProcessor: input.preferredProcessor ?? "",
          routingReason: decision.reason,
          routingCandidates: JSON.stringify(decision.candidates),
          settlementCurrency,
          settlementAmount: String(conversion.amount),
          fxRate: String(conversion.fxRate),
          baseCurrency: conversion.baseCurrency,
          processorPaymentId: processorAuth?.providerPaymentId ?? "",
          processorDeclineReason: processorAuth?.declineReason ?? ""
        },
    createdAt: new Date().toISOString(),
    capturedAt: null
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("payments")
      .insert({
        id: payment.id,
        merchant_id: payment.merchantId,
        customer_id: payment.customerId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        risk_score: payment.riskScore,
        metadata: payment.metadata,
        captured_at: payment.capturedAt,
        idempotency_key: idempotencyKey ?? null
      })
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    await emitWebhookEvent(merchant, {
      type: payment.status === "failed" ? "payment.failed" : "payment.authorized",
      payload: {
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        settlementAmount: payment.settlementAmount,
        settlementCurrency: payment.settlementCurrency,
        processor: payment.processor
      }
    });

    return fromPaymentRow(
      inserted.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  db.payments.set(payment.id, payment);
  await emitWebhookEvent(merchant, {
    type: payment.status === "failed" ? "payment.failed" : "payment.authorized",
    payload: { paymentId: payment.id, amount: payment.amount, currency: payment.currency }
  });

  return payment;
}

export async function getPaymentById(merchant: MerchantRecord, paymentId: string): Promise<PaymentRecord> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const payment = await supabase
      .from("payments")
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .eq("merchant_id", merchant.id)
      .eq("id", paymentId)
      .maybeSingle();

    if (payment.error) {
      throw new Error(payment.error.message);
    }

    if (!payment.data) {
      throw new AppError(404, "payment_not_found");
    }

    return fromPaymentRow(
      payment.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  const payment = db.payments.get(paymentId);
  if (!payment || payment.merchantId !== merchant.id) {
    throw new AppError(404, "payment_not_found");
  }

  return payment;
}

export async function capturePayment(merchant: MerchantRecord, paymentId: string): Promise<PaymentRecord> {
  const payment = await getPaymentById(merchant, paymentId);

  if (!["authorized", "requires_action"].includes(payment.status)) {
    throw new AppError(409, "payment_not_authorized");
  }

  const capturedAt = new Date().toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updated = await supabase
      .from("payments")
      .update({ status: "succeeded", captured_at: capturedAt })
      .eq("id", payment.id)
      .eq("merchant_id", merchant.id)
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    await emitWebhookEvent(merchant, {
      type: "payment.succeeded",
      payload: { paymentId: payment.id }
    });

    return fromPaymentRow(
      updated.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  payment.status = "succeeded";
  payment.capturedAt = capturedAt;
  db.payments.set(payment.id, payment);

  await emitWebhookEvent(merchant, {
    type: "payment.succeeded",
    payload: { paymentId: payment.id }
  });

  return payment;
}

function applyPaymentFilters(payments: PaymentRecord[], filters?: ListPaymentsQueryInput) {
  if (!filters) {
    return payments;
  }

  const createdFromTs = filters.createdFrom ? Date.parse(filters.createdFrom) : null;
  const createdToTs = filters.createdTo ? Date.parse(filters.createdTo) : null;
  const searchQuery = filters.q?.toLowerCase() ?? null;

  return payments.filter((payment) => {
    if (filters.status && payment.status !== filters.status) {
      return false;
    }
    if (filters.currency && payment.currency.toUpperCase() !== filters.currency.toUpperCase()) {
      return false;
    }
    if (typeof filters.minAmount === "number" && payment.amount < filters.minAmount) {
      return false;
    }
    if (typeof filters.maxAmount === "number" && payment.amount > filters.maxAmount) {
      return false;
    }
    const createdAtTs = Date.parse(payment.createdAt);
    if (createdFromTs !== null && createdAtTs < createdFromTs) {
      return false;
    }
    if (createdToTs !== null && createdAtTs > createdToTs) {
      return false;
    }
    if (searchQuery) {
      const matches =
        payment.id.toLowerCase().includes(searchQuery) ||
        payment.metadata.customerEmail?.toLowerCase().includes(searchQuery) ||
        JSON.stringify(payment.metadata).toLowerCase().includes(searchQuery);
      if (!matches) {
        return false;
      }
    }
    return true;
  });
}

export async function listPayments(merchant: MerchantRecord, filters?: ListPaymentsQueryInput) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("payments")
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .eq("merchant_id", merchant.id);

    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.currency) {
      query = query.eq("currency", filters.currency.toUpperCase());
    }
    if (typeof filters?.minAmount === "number") {
      query = query.gte("amount", filters.minAmount);
    }
    if (typeof filters?.maxAmount === "number") {
      query = query.lte("amount", filters.maxAmount);
    }
    if (filters?.createdFrom) {
      query = query.gte("created_at", filters.createdFrom);
    }
    if (filters?.createdTo) {
      query = query.lte("created_at", filters.createdTo);
    }

    const payments = await query.order("created_at", { ascending: false });

    if (payments.error) {
      throw new Error(payments.error.message);
    }

    const rows = (payments.data as Array<{
      id: string;
      merchant_id: string;
      customer_id: string | null;
      amount: number;
      currency: string;
      status: PaymentRecord["status"];
      risk_score: number;
      metadata: Record<string, string>;
      created_at: string;
      captured_at: string | null;
    }>).map(fromPaymentRow);
    return applyPaymentFilters(rows, filters);
  }

  const rows = Array.from(db.payments.values()).filter((payment) => payment.merchantId === merchant.id);
  return applyPaymentFilters(rows, filters);
}

export async function listLatestPayments(merchant: MerchantRecord, limit = 15) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const payments = await supabase
      .from("payments")
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (payments.error) {
      throw new Error(payments.error.message);
    }

    return (payments.data as Array<{
      id: string;
      merchant_id: string;
      customer_id: string | null;
      amount: number;
      currency: string;
      status: PaymentRecord["status"];
      risk_score: number;
      metadata: Record<string, string>;
      created_at: string;
      captured_at: string | null;
    }>).map(fromPaymentRow);
  }

  return Array.from(db.payments.values())
    .filter((payment) => payment.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit);
}

export async function updatePaymentStatus(
  merchant: MerchantRecord,
  paymentId: string,
  status: PaymentRecord["status"]
) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updated = await supabase
      .from("payments")
      .update({ status })
      .eq("id", paymentId)
      .eq("merchant_id", merchant.id)
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    return fromPaymentRow(
      updated.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  const payment = await getPaymentById(merchant, paymentId);
  payment.status = status;
  db.payments.set(payment.id, payment);
  return payment;
}

export async function authenticatePaymentThreeDS(
  merchant: MerchantRecord,
  paymentId: string,
  payload: { challengeResult: "authenticated" | "failed"; eci?: string; dsTransactionId?: string }
) {
  const payment = await getPaymentById(merchant, paymentId);
  if (payment.status !== "requires_action") {
    throw new AppError(409, "payment_not_in_3ds_flow");
  }
  const providerResult = await completeThreeDSWithProvider({
    transactionId: payment.metadata.threeDSTransactionId ?? "",
    challengeResult: payload.challengeResult,
    eci: payload.eci,
    dsTransactionId: payload.dsTransactionId
  });
  if (payload.challengeResult === "authenticated" && !providerResult.approved) {
    throw new AppError(402, "three_ds_provider_rejected");
  }
  const metadata = {
    ...payment.metadata,
    threeDSChallengeResult: payload.challengeResult,
    threeDSEci: payload.eci ?? "",
    threeDSDsTransactionId: payload.dsTransactionId ?? "",
    threeDSAuthenticatedAt: new Date().toISOString()
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updated = await supabase
      .from("payments")
      .update({
        status: payload.challengeResult === "authenticated" ? "authorized" : "failed",
        metadata
      })
      .eq("id", payment.id)
      .eq("merchant_id", merchant.id)
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    return fromPaymentRow(
      updated.data as {
        id: string;
        merchant_id: string;
        customer_id: string | null;
        amount: number;
        currency: string;
        status: PaymentRecord["status"];
        risk_score: number;
        metadata: Record<string, string>;
        created_at: string;
        captured_at: string | null;
      }
    );
  }

  payment.metadata = metadata;
  payment.status = payload.challengeResult === "authenticated" ? "authorized" : "failed";
  db.payments.set(payment.id, payment);
  return payment;
}

export async function initiatePaymentThreeDS(
  merchant: MerchantRecord,
  paymentId: string,
  payload: { returnUrl: string; deviceChannel: "browser" | "app" }
) {
  const payment = await getPaymentById(merchant, paymentId);
  if (payment.status !== "requires_action") {
    throw new AppError(409, "payment_not_in_3ds_flow");
  }

  const providerResult = await initiateThreeDSWithProvider({
    paymentId: payment.id,
    amount: payment.amount,
    currency: payment.currency,
    returnUrl: payload.returnUrl,
    deviceChannel: payload.deviceChannel
  });
  const transactionId = providerResult.transactionId;
  const metadata = {
    ...payment.metadata,
    threeDSStatus: "challenge_required",
    threeDSTransactionId: transactionId,
    threeDSReturnUrl: payload.returnUrl,
    threeDSDeviceChannel: payload.deviceChannel,
    threeDSChallengeUrl: providerResult.challengeUrl
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updated = await supabase
      .from("payments")
      .update({ metadata })
      .eq("id", payment.id)
      .eq("merchant_id", merchant.id)
      .select("id, merchant_id, customer_id, amount, currency, status, risk_score, metadata, created_at, captured_at")
      .single();

    if (updated.error) {
      throw new Error(updated.error.message);
    }

    return {
      payment: fromPaymentRow(
        updated.data as {
          id: string;
          merchant_id: string;
          customer_id: string | null;
          amount: number;
          currency: string;
          status: PaymentRecord["status"];
          risk_score: number;
          metadata: Record<string, string>;
          created_at: string;
          captured_at: string | null;
        }
      ),
      challengeUrl: metadata.threeDSChallengeUrl,
      transactionId
    };
  }

  payment.metadata = metadata;
  db.payments.set(payment.id, payment);
  return { payment, challengeUrl: metadata.threeDSChallengeUrl, transactionId };
}

export async function getRefundedAmount(paymentId: string) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const refunds = await supabase
      .from("refunds")
      .select("amount")
      .eq("payment_id", paymentId)
      .eq("status", "succeeded");

    if (refunds.error) {
      throw new Error(refunds.error.message);
    }

    return (refunds.data as Array<{ amount: number }>).reduce(
      (sum: number, refund: { amount: number }) => sum + Number(refund.amount),
      0
    );
  }

  return Array.from(db.refunds.values())
    .filter((refund) => refund.paymentId === paymentId && refund.status === "succeeded")
    .reduce((sum, refund) => sum + refund.amount, 0);
}

export async function getPaymentRoutingDetails(merchant: MerchantRecord, paymentId: string) {
  const payment = await getPaymentById(merchant, paymentId);

  let candidates: Array<{ processor: string; score: number }> = [];
  if (payment.metadata.routingCandidates) {
    try {
      const parsed = JSON.parse(payment.metadata.routingCandidates) as Array<{ processor: string; score: number }>;
      if (Array.isArray(parsed)) {
        candidates = parsed;
      }
    } catch {
      candidates = [];
    }
  }

  return {
    paymentId: payment.id,
    selectedProcessor: payment.processor,
    routingMode: payment.metadata.routingMode ?? "auto",
    routeType: payment.metadata.routeType ?? "card",
    reason: payment.metadata.routingReason ?? "not_available",
    candidates
  };
}
