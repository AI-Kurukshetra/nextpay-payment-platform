import { AppError } from "@/lib/api/errors";
import type { MerchantRecord } from "@/lib/store/types";
import { createPayment, getPaymentById, listPayments } from "@/lib/services/payment-service";
import { listCustomers } from "@/lib/services/customer-service";
import { getAnalyticsOverview } from "@/lib/services/analytics-service";

type GraphQLBody = {
  query: string;
  variables?: Record<string, string | number | boolean | undefined>;
};

function hasToken(query: string, token: string) {
  return query.replace(/\s+/g, " ").includes(token);
}

export async function executeGraphQL(merchant: MerchantRecord, body: GraphQLBody) {
  const query = body.query.trim();
  const vars = body.variables ?? {};

  if (query.startsWith("mutation") && hasToken(query, "createPayment")) {
    const amount = Number(vars.amount ?? 0);
    const currency = String(vars.currency ?? "USD");
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new AppError(400, "invalid_graphql_amount");
    }
    const payment = await createPayment(merchant, { amount, currency, metadata: { source: "graphql" } });
    return { data: { createPayment: payment } };
  }

  if (hasToken(query, "payments")) {
    const limit = Number(vars.limit ?? 20);
    const payments = await listPayments(merchant);
    return { data: { payments: payments.slice(0, Math.max(1, Math.min(100, limit))) } };
  }

  if (hasToken(query, "paymentById")) {
    const id = String(vars.id ?? "");
    if (!id) {
      throw new AppError(400, "graphql_id_required");
    }
    const payment = await getPaymentById(merchant, id);
    return { data: { paymentById: payment } };
  }

  if (hasToken(query, "customers")) {
    const customers = await listCustomers(merchant);
    return { data: { customers } };
  }

  if (hasToken(query, "analyticsOverview")) {
    const overview = await getAnalyticsOverview(merchant);
    return { data: { analyticsOverview: overview } };
  }

  throw new AppError(400, "unsupported_graphql_query");
}
