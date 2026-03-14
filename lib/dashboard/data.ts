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
      eventTypes: [] as string[]
    };
  }

  const [overview, alerts, subscriptions, events] = await Promise.all([
    getAnalyticsOverview(merchant),
    listFraudAlerts(merchant),
    listSubscriptions(merchant),
    listWebhookEvents(merchant)
  ]);

  const eventTypes = Array.from(new Set(events.map((event) => event.type))).slice(0, 6);

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
    eventTypes
  };
}

export async function getPaymentsData() {
  const merchant = await getDashboardMerchant();
  if (!merchant) {
    return { isConfigured: false, payments: [] };
  }

  const payments = await listPayments(merchant);
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
