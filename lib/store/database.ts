import type {
  ApiKeyRecord,
  AuditLogRecord,
  CustomerRecord,
  FraudAlertRecord,
  MerchantRecord,
  PaymentRecord,
  RefundRecord,
  SubscriptionPlanRecord,
  SubscriptionRecord,
  WebhookDeliveryRecord,
  WebhookEndpointRecord,
  WebhookEventRecord
} from "@/lib/store/types";

export const db = {
  merchants: new Map<string, MerchantRecord>(),
  apiKeys: new Map<string, ApiKeyRecord>(),
  auditLogs: new Map<string, AuditLogRecord>(),
  customers: new Map<string, CustomerRecord>(),
  payments: new Map<string, PaymentRecord>(),
  refunds: new Map<string, RefundRecord>(),
  subscriptionPlans: new Map<string, SubscriptionPlanRecord>(),
  subscriptions: new Map<string, SubscriptionRecord>(),
  webhookEndpoints: new Map<string, WebhookEndpointRecord>(),
  webhookEvents: new Map<string, WebhookEventRecord>(),
  webhookDeliveries: new Map<string, WebhookDeliveryRecord>(),
  fraudAlerts: new Map<string, FraudAlertRecord>()
};

export function resetDb() {
  db.merchants.clear();
  db.apiKeys.clear();
  db.auditLogs.clear();
  db.customers.clear();
  db.payments.clear();
  db.refunds.clear();
  db.subscriptionPlans.clear();
  db.subscriptions.clear();
  db.webhookEndpoints.clear();
  db.webhookEvents.clear();
  db.webhookDeliveries.clear();
  db.fraudAlerts.clear();
}
