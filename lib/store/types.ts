export type PaymentStatus =
  | "requires_payment_method"
  | "requires_action"
  | "authorized"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type RefundStatus = "pending" | "succeeded" | "failed";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export type MerchantRecord = {
  id: string;
  email: string;
  name: string;
  apiKeyHash: string;
  createdAt: string;
};

export type ApiKeyRecord = {
  id: string;
  merchantId: string;
  keyHash: string;
  keyPrefix: string;
  keyLast4: string;
  label: string | null;
  status: "active" | "revoked";
  createdAt: string;
  revokedAt: string | null;
};

export type AuditLogRecord = {
  id: string;
  merchantId: string;
  action: string;
  actor: string;
  metadata: Record<string, string>;
  createdAt: string;
};

export type CustomerRecord = {
  id: string;
  merchantId: string;
  email: string;
  name: string;
  createdAt: string;
};

export type PaymentMethodRecord = {
  id: string;
  merchantId: string;
  customerId: string;
  type: "card";
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  token: string;
  fingerprint: string;
  createdAt: string;
};

export type WalletSessionRecord = {
  id: string;
  merchantId: string;
  customerId: string | null;
  amount: number;
  currency: string;
  provider: "apple_pay" | "google_pay";
  status: "created" | "authorized" | "expired";
  clientSecret: string;
  providerSessionId: string;
  authToken: string | null;
  paymentId: string | null;
  expiresAt: string;
  createdAt: string;
};

export type PaymentRecord = {
  id: string;
  merchantId: string;
  customerId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  riskScore: number;
  processor: "stripe" | "adyen" | "razorpay" | "bank_gateway" | "crypto_processor";
  settlementCurrency: string;
  settlementAmount: number;
  fxRate: number;
  metadata: Record<string, string>;
  createdAt: string;
  capturedAt: string | null;
};

export type RefundRecord = {
  id: string;
  paymentId: string;
  merchantId: string;
  amount: number;
  status: RefundStatus;
  reason: string | null;
  createdAt: string;
};

export type SubscriptionPlanRecord = {
  id: string;
  merchantId: string;
  name: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  trialDays: number;
  createdAt: string;
};

export type SubscriptionRecord = {
  id: string;
  merchantId: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  nextBillingAt: string;
  trialEndsAt: string | null;
  dunningAttempts: number;
  canceledAt: string | null;
  createdAt: string;
};

export type PaymentLinkRecord = {
  id: string;
  merchantId: string;
  token: string;
  amount: number;
  currency: string;
  description: string | null;
  isActive: boolean;
  expiresAt: string | null;
  maxUses: number | null;
  useCount: number;
  createdAt: string;
};

export type DisputeRecord = {
  id: string;
  merchantId: string;
  paymentId: string;
  reason: string;
  amount: number;
  status: "open" | "under_review" | "won" | "lost";
  evidence: string | null;
  createdAt: string;
  updatedAt: string;
};

export type FraudRuleRecord = {
  id: string;
  merchantId: string;
  name: string;
  minAmount: number | null;
  maxAmount: number | null;
  currency: string | null;
  riskScoreIncrement: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type WebhookEndpointRecord = {
  id: string;
  merchantId: string;
  url: string;
  secret: string;
  isActive: boolean;
  verifiedAt?: string | null;
  createdAt: string;
};

export type WebhookEventRecord = {
  id: string;
  merchantId: string;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type WebhookDeliveryRecord = {
  id: string;
  eventId: string;
  endpointId: string;
  status: "pending" | "delivered" | "failed";
  attempt: number;
  error: string | null;
  nextRetryAt: string | null;
  createdAt: string;
};

export type FraudAlertRecord = {
  id: string;
  paymentId: string;
  merchantId: string;
  severity: "low" | "medium" | "high";
  reason: string;
  createdAt: string;
};

export type SettlementRecord = {
  id: string;
  merchantId: string;
  amount: number;
  currency: string;
  settlementAmount: number;
  settlementCurrency: string;
  fxRate: number;
  payoutMethod: "standard" | "instant";
  payoutProvider: "mock_bank_ach" | "mock_rtp" | "stripe_treasury" | "razorpayx";
  destination: string;
  feeAmount: number;
  failureReason: string | null;
  providerReference: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  scheduledAt: string;
  processedAt: string | null;
  createdAt: string;
};

export type SubMerchantRecord = {
  id: string;
  merchantId: string;
  name: string;
  email: string;
  status: "active" | "suspended";
  createdAt: string;
};

export type SplitTransferRecord = {
  id: string;
  merchantId: string;
  paymentId: string;
  subMerchantId: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
};

export type InvoiceRecord = {
  id: string;
  merchantId: string;
  customerId: string;
  subscriptionId: string | null;
  amount: number;
  currency: string;
  status: "draft" | "open" | "paid" | "void";
  dueAt: string;
  createdAt: string;
};

export type ExperimentRecord = {
  id: string;
  merchantId: string;
  name: string;
  variants: string[];
  trafficPercent: number;
  isActive: boolean;
  createdAt: string;
};

export type ExperimentAssignmentRecord = {
  id: string;
  merchantId: string;
  experimentId: string;
  subjectKey: string;
  variant: string;
  createdAt: string;
};

export type CryptoQuoteRecord = {
  id: string;
  merchantId: string;
  fiatAmount: number;
  fiatCurrency: string;
  asset: "BTC" | "ETH" | "USDC";
  assetAmount: string;
  rate: number;
  expiresAt: string;
  createdAt: string;
};

export type NotificationRecord = {
  id: string;
  merchantId: string;
  channel: "email" | "sms" | "dashboard" | "webhook";
  title: string;
  message: string;
  status: "unread" | "read";
  createdAt: string;
  readAt: string | null;
};

export type MerchantPaymentPreferencesRecord = {
  merchantId: string;
  allowCard: boolean;
  allowBank: boolean;
  allowCrypto: boolean;
  createdAt: string;
  updatedAt: string;
};
