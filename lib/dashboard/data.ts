import { getAnalyticsOverview } from "@/lib/services/analytics-service";
import { listCustomers } from "@/lib/services/customer-service";
import { listFraudAlerts } from "@/lib/services/fraud-service";
import { listPayments } from "@/lib/services/payment-service";
import { listSubscriptions } from "@/lib/services/subscription-service";
import {
  listWebhookDeliveries,
  listWebhookEndpoints,
  listWebhookEvents
} from "@/lib/services/webhook-service";
import { getDashboardSessionMerchant } from "@/lib/auth/dashboard-session";
import type { ListPaymentsQueryInput } from "@/lib/validations/payment";

export async function getDashboardMerchant() {
  return getDashboardSessionMerchant();
}

export async function getOverviewData() {
  const merchant = await getDashboardMerchant();

  if (!merchant) {
    return {
      isConfigured: false,
      kpis: {
        totalPaymentVolume: 0,
        successfulPayments: 0,
        totalPayments: 0,
        successRate: 0,
        fraudRate: 0,
        activeSubscriptions: 0
      },
      eventTypes: [] as string[],
      onboardingChecklist: [] as Array<{ key: string; label: string; done: boolean }>,
      processorInsights: [] as Array<{ processor: string; total: number; successRate: number }>
    };
  }

  const [overview, alerts, subscriptions, events, payments, customers, endpoints] = await Promise.all([
    getAnalyticsOverview(merchant),
    listFraudAlerts(merchant),
    listSubscriptions(merchant),
    listWebhookEvents(merchant),
    listPayments(merchant),
    listCustomers(merchant),
    listWebhookEndpoints(merchant)
  ]);

  const eventTypes = Array.from(new Set(events.map((event) => event.type))).slice(0, 6);

  const byProcessor = new Map<string, { total: number; success: number }>();
  for (const payment of payments) {
    const processor = payment.processor;
    const row = byProcessor.get(processor) ?? { total: 0, success: 0 };
    row.total += 1;
    if (payment.status === "succeeded") {
      row.success += 1;
    }
    byProcessor.set(processor, row);
  }
  const processorInsights = Array.from(byProcessor.entries())
    .map(([processor, metric]) => ({
      processor,
      total: metric.total,
      successRate: metric.total === 0 ? 0 : Number((metric.success / metric.total).toFixed(4))
    }))
    .sort((a, b) => b.successRate - a.successRate)
    .slice(0, 5);

  const onboardingChecklist = [
    { key: "customer", label: "Create at least one customer", done: customers.length > 0 },
    { key: "payment", label: "Create your first payment", done: payments.length > 0 },
    { key: "webhook", label: "Configure a webhook endpoint", done: endpoints.length > 0 },
    {
      key: "subscription",
      label: "Create a subscription plan",
      done: subscriptions.length > 0
    }
  ];

  return {
    isConfigured: true,
    kpis: {
      totalPaymentVolume: overview.totalPaymentVolume,
      successfulPayments: overview.successfulPayments,
      totalPayments: overview.totalPayments,
      successRate: overview.successRate,
      fraudRate: overview.totalPayments === 0 ? 0 : Number((alerts.length / overview.totalPayments).toFixed(4)),
      activeSubscriptions: subscriptions.filter((subscription) => ["active", "trialing"].includes(subscription.status))
        .length
    },
    eventTypes,
    onboardingChecklist,
    processorInsights
  };
}

export async function getPaymentsData(filters?: ListPaymentsQueryInput) {
  const merchant = await getDashboardMerchant();
  if (!merchant) {
    return { isConfigured: false, payments: [] };
  }

  const payments = await listPayments(merchant, filters);
  return { isConfigured: true, payments };
}

export async function getCustomersData() {
  const merchant = await getDashboardMerchant();
  if (!merchant) {
    return { isConfigured: false, customers: [] };
  }

  const customers = await listCustomers(merchant);
  return { isConfigured: true, customers };
}

export async function getSubscriptionsData() {
  const merchant = await getDashboardMerchant();
  if (!merchant) {
    return { isConfigured: false, subscriptions: [] };
  }

  const subscriptions = await listSubscriptions(merchant);
  return { isConfigured: true, subscriptions };
}

export async function getWebhooksData() {
  const merchant = await getDashboardMerchant();
  if (!merchant) {
    return { isConfigured: false, endpoints: [], deliveries: [], events: [] };
  }

  const [endpoints, deliveries, events] = await Promise.all([
    listWebhookEndpoints(merchant),
    listWebhookDeliveries(merchant),
    listWebhookEvents(merchant)
  ]);

  return { isConfigured: true, endpoints, deliveries, events };
}
