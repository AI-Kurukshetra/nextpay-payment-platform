export type PaymentStatus =
  | "requires_payment_method"
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

export type PaymentRecord = {
  id: string;
  merchantId: string;
  customerId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  riskScore: number;
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
  createdAt: string;
};

export type WebhookEndpointRecord = {
  id: string;
  merchantId: string;
  url: string;
  secret: string;
  isActive: boolean;
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
