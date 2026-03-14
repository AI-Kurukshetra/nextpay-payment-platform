import type {
  ApiKeyRecord,
  AuditLogRecord,
  CustomerRecord,
  DisputeRecord,
  FraudAlertRecord,
  FraudRuleRecord,
  InvoiceRecord,
  CryptoQuoteRecord,
  MerchantRecord,
  PaymentMethodRecord,
  PaymentLinkRecord,
  PaymentRecord,
  RefundRecord,
  SettlementRecord,
  SplitTransferRecord,
  SubMerchantRecord,
  SubscriptionPlanRecord,
  SubscriptionRecord,
  ExperimentAssignmentRecord,
  ExperimentRecord,
  WalletSessionRecord,
  WebhookDeliveryRecord,
  WebhookEndpointRecord,
  WebhookEventRecord
} from "@/lib/store/types";

export const db = {
  merchants: new Map<string, MerchantRecord>(),
  apiKeys: new Map<string, ApiKeyRecord>(),
  auditLogs: new Map<string, AuditLogRecord>(),
  customers: new Map<string, CustomerRecord>(),
  paymentMethods: new Map<string, PaymentMethodRecord>(),
  walletSessions: new Map<string, WalletSessionRecord>(),
  payments: new Map<string, PaymentRecord>(),
  refunds: new Map<string, RefundRecord>(),
  paymentLinks: new Map<string, PaymentLinkRecord>(),
  disputes: new Map<string, DisputeRecord>(),
  fraudRules: new Map<string, FraudRuleRecord>(),
  subscriptionPlans: new Map<string, SubscriptionPlanRecord>(),
  subscriptions: new Map<string, SubscriptionRecord>(),
  webhookEndpoints: new Map<string, WebhookEndpointRecord>(),
  webhookEvents: new Map<string, WebhookEventRecord>(),
  webhookDeliveries: new Map<string, WebhookDeliveryRecord>(),
  fraudAlerts: new Map<string, FraudAlertRecord>(),
  settlements: new Map<string, SettlementRecord>(),
  invoices: new Map<string, InvoiceRecord>(),
  subMerchants: new Map<string, SubMerchantRecord>(),
  splitTransfers: new Map<string, SplitTransferRecord>(),
  experiments: new Map<string, ExperimentRecord>(),
  experimentAssignments: new Map<string, ExperimentAssignmentRecord>(),
  cryptoQuotes: new Map<string, CryptoQuoteRecord>()
};

export function resetDb() {
  db.merchants.clear();
  db.apiKeys.clear();
  db.auditLogs.clear();
  db.customers.clear();
  db.paymentMethods.clear();
  db.walletSessions.clear();
  db.payments.clear();
  db.refunds.clear();
  db.paymentLinks.clear();
  db.disputes.clear();
  db.fraudRules.clear();
  db.subscriptionPlans.clear();
  db.subscriptions.clear();
  db.webhookEndpoints.clear();
  db.webhookEvents.clear();
  db.webhookDeliveries.clear();
  db.fraudAlerts.clear();
  db.settlements.clear();
  db.invoices.clear();
  db.subMerchants.clear();
  db.splitTransfers.clear();
  db.experiments.clear();
  db.experimentAssignments.clear();
  db.cryptoQuotes.clear();
}
