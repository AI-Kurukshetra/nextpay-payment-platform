type HttpMethod = "get" | "post" | "patch" | "delete";

type OpenApiOperation = {
  summary: string;
  tags: string[];
  security?: Array<Record<string, string[]>>;
  parameters?: Array<{
    name: string;
    in: "path" | "header";
    required: boolean;
    schema: { type: string };
    description?: string;
  }>;
  requestBody?: {
    required: boolean;
    content: {
      "application/json": {
        schema: Record<string, unknown>;
      };
    };
  };
  responses: Record<string, { description: string }>;
};

type OpenApiPathItem = Partial<Record<HttpMethod, OpenApiOperation>>;

type OpenApiDocument = {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{ url: string }>;
  tags: Array<{ name: string; description: string }>;
  components: {
    securitySchemes: Record<string, Record<string, string>>;
    schemas: Record<string, Record<string, unknown>>;
  };
  paths: Record<string, OpenApiPathItem>;
};

const apiKeyAuth = [{ ApiKeyAuth: [] }];
const dashboardCookieAuth = [{ DashboardSessionCookie: [] }];

const idPathParam = {
  name: "id",
  in: "path" as const,
  required: true,
  schema: { type: "string" },
  description: "Resource ID"
};

export function buildOpenApiSpec(origin: string): OpenApiDocument {
  return {
    openapi: "3.0.3",
    info: {
      title: "PayForge API",
      version: "1.0.0",
      description: "Developer-first payment gateway API documentation."
    },
    servers: [{ url: `${origin}/api/v1` }],
    tags: [
      { name: "Auth", description: "Merchant authentication and dashboard session endpoints." },
      { name: "Payments", description: "Payment creation, retrieval, capture, and refunds." },
      { name: "Customers", description: "Customer CRUD-lite endpoints." },
      { name: "Subscriptions", description: "Plan and subscription management." },
      { name: "Payment Methods", description: "Customer payment method vault and tokenization APIs." },
      { name: "Invoices", description: "Invoice generation and lifecycle APIs." },
      { name: "Settlements", description: "Settlement scheduling and payout processing." },
      { name: "Marketplace", description: "Multi-tenant sub-merchant and split transfer APIs." },
      { name: "Payment Links", description: "Payment link generation and hosted pay flow APIs." },
      { name: "Disputes", description: "Dispute intake and case lifecycle." },
      { name: "Webhooks", description: "Webhook endpoint/event/retry operations." },
      { name: "Fraud", description: "Fraud alert access." },
      { name: "Analytics", description: "Dashboard analytics overview." },
      { name: "Optimization", description: "AI-powered routing and retry optimization recommendations." },
      { name: "GraphQL", description: "GraphQL API gateway endpoint." },
      { name: "Crypto", description: "Cryptocurrency quote and payment confirmation APIs." },
      { name: "Experiments", description: "A/B testing framework APIs." },
      { name: "Compliance", description: "Compliance automation and reporting APIs." },
      { name: "Pricing", description: "Dynamic pricing recommendation APIs." },
      { name: "Voice", description: "Voice payment command APIs with ASR/NLU interpretation." },
      { name: "Notifications", description: "Merchant notification feed and delivery status APIs." },
      { name: "Reporting", description: "Transaction export and summary reporting." },
      { name: "Streaming", description: "Real-time transaction event stream." },
      { name: "Sandbox", description: "Testing cards and sandbox resources." },
      { name: "Dashboard", description: "Cookie-session merchant dashboard actions." },
      { name: "Workers", description: "Background worker orchestration endpoints." }
    ],
    components: {
      securitySchemes: {
        ApiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
          description: "Merchant API key prefixed with np_live_."
        },
        DashboardSessionCookie: {
          type: "apiKey",
          in: "cookie",
          name: "payforge_dashboard_session",
          description: "HttpOnly dashboard session cookie set by /auth/login."
        }
      },
      schemas: {
        RegisterMerchantRequest: {
          type: "object",
          required: ["email", "name"],
          properties: {
            email: { type: "string", format: "email" },
            name: { type: "string", minLength: 2 }
          }
        },
        LoginRequest: {
          type: "object",
          required: ["apiKey"],
          properties: {
            apiKey: { type: "string", example: "np_live_xxx" }
          }
        },
        RotateApiKeyRequest: {
          type: "object",
          properties: {
            label: { type: "string", minLength: 2, maxLength: 40 },
            reason: { type: "string", minLength: 3, maxLength: 200 }
          }
        },
        RevokeApiKeyRequest: {
          type: "object",
          required: ["apiKey"],
          properties: {
            apiKey: { type: "string", example: "np_live_xxx" },
            reason: { type: "string", minLength: 3, maxLength: 200 }
          }
        },
        CreatePaymentRequest: {
          type: "object",
          required: ["amount", "currency"],
          properties: {
            customerId: { type: "string", format: "uuid" },
            amount: { type: "integer", minimum: 1 },
            currency: { type: "string", minLength: 3, maxLength: 3, example: "USD" },
            settlementCurrency: { type: "string", minLength: 3, maxLength: 3, example: "USD" },
            require3ds: { type: "boolean", default: false },
            routingMode: { type: "string", enum: ["auto", "manual"], default: "auto" },
            routeType: { type: "string", enum: ["card", "bank", "crypto"], default: "card" },
            preferredProcessor: {
              type: "string",
              enum: ["stripe", "adyen", "razorpay", "bank_gateway", "crypto_processor"]
            },
            metadata: { type: "object", additionalProperties: { type: "string" } }
          }
        },
        VoicePaymentCommandRequest: {
          type: "object",
          properties: {
            source: { type: "string", enum: ["text", "audio"], default: "text" },
            transcript: { type: "string", minLength: 3, maxLength: 500 },
            audioUrl: { type: "string", format: "uri" },
            audioBase64: { type: "string", minLength: 20 },
            idempotencyKey: { type: "string", minLength: 6, maxLength: 120 },
            metadata: { type: "object", additionalProperties: { type: "string" } }
          }
        },
        RefundRequest: {
          type: "object",
          required: ["amount"],
          properties: {
            amount: { type: "integer", minimum: 1 },
            reason: { type: "string", minLength: 3, maxLength: 200 }
          }
        },
        CreateCustomerRequest: {
          type: "object",
          required: ["email", "name"],
          properties: {
            email: { type: "string", format: "email" },
            name: { type: "string", minLength: 2 }
          }
        },
        CreateSubscriptionPlanRequest: {
          type: "object",
          required: ["name", "amount", "currency", "interval"],
          properties: {
            name: { type: "string", minLength: 2 },
            amount: { type: "integer", minimum: 1 },
            currency: { type: "string", minLength: 3, maxLength: 3, example: "USD" },
            interval: { type: "string", enum: ["month", "year"] },
            trialDays: { type: "integer", minimum: 0, maximum: 90 }
          }
        },
        CreateSubscriptionRequest: {
          type: "object",
          required: ["customerId", "planId"],
          properties: {
            customerId: { type: "string", format: "uuid" },
            planId: { type: "string", format: "uuid" }
          }
        },
        RegisterWebhookEndpointRequest: {
          type: "object",
          required: ["url"],
          properties: {
            url: { type: "string", format: "uri" }
          }
        },
        EmitWebhookEventRequest: {
          type: "object",
          required: ["type", "payload"],
          properties: {
            type: { type: "string", minLength: 3 },
            payload: { type: "object", additionalProperties: true }
          }
        },
        CreateNotificationRequest: {
          type: "object",
          required: ["title", "message"],
          properties: {
            channel: { type: "string", enum: ["email", "sms", "dashboard", "webhook"] },
            title: { type: "string", minLength: 3, maxLength: 120 },
            message: { type: "string", minLength: 3, maxLength: 500 }
          }
        },
        UpdateNotificationRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["unread", "read"] }
          }
        },
        UpdatePaymentPreferencesRequest: {
          type: "object",
          required: ["allowCard", "allowBank", "allowCrypto"],
          properties: {
            allowCard: { type: "boolean" },
            allowBank: { type: "boolean" },
            allowCrypto: { type: "boolean" }
          }
        }
      }
    },
    paths: {
      "/openapi": {
        get: {
          summary: "Get OpenAPI spec JSON",
          tags: ["Auth"],
          responses: { "200": { description: "OpenAPI document" } }
        }
      },
      "/auth/register": {
        post: {
          summary: "Register merchant account",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RegisterMerchantRequest" } }
            }
          },
          responses: {
            "201": { description: "Merchant registered with API key" },
            "400": { description: "Validation error" },
            "409": { description: "Merchant already exists" }
          }
        }
      },
      "/auth/login": {
        post: {
          summary: "Login merchant dashboard with API key",
          tags: ["Auth"],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } }
            }
          },
          responses: {
            "200": { description: "Authenticated and session cookie set" },
            "401": { description: "Invalid API key" }
          }
        }
      },
      "/auth/session": {
        post: {
          summary: "Logout merchant dashboard session",
          tags: ["Auth"],
          responses: {
            "307": { description: "Session cookie cleared and redirected" }
          }
        }
      },
      "/auth/api-keys": {
        get: {
          summary: "List merchant API keys",
          tags: ["Auth"],
          security: apiKeyAuth,
          responses: {
            "200": { description: "API keys list" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/auth/api-keys/rotate": {
        post: {
          summary: "Rotate API key",
          tags: ["Auth"],
          security: apiKeyAuth,
          requestBody: {
            required: false,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RotateApiKeyRequest" } }
            }
          },
          responses: {
            "201": { description: "New API key issued and previous revoked" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/auth/api-keys/revoke": {
        post: {
          summary: "Revoke one active API key",
          tags: ["Auth"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RevokeApiKeyRequest" } }
            }
          },
          responses: {
            "200": { description: "Key revoked" },
            "404": { description: "Key not found" },
            "409": { description: "Cannot revoke last active key" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/auth/api-keys/audit": {
        get: {
          summary: "List API key audit logs",
          tags: ["Auth"],
          security: apiKeyAuth,
          responses: {
            "200": { description: "Audit logs list" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/payments": {
        post: {
          summary: "Create payment",
          tags: ["Payments"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreatePaymentRequest" } }
            }
          },
          responses: {
            "201": { description: "Payment created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List payments",
          tags: ["Payments"],
          security: apiKeyAuth,
          responses: { "200": { description: "Payments list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/payments/voice/commands": {
        post: {
          summary: "Execute voice payment command",
          tags: ["Voice"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/VoicePaymentCommandRequest" } }
            }
          },
          responses: {
            "201": { description: "Voice command executed" },
            "400": { description: "Validation or command parsing error" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/payments/{id}": {
        get: {
          summary: "Get payment by ID",
          tags: ["Payments"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "Payment details" },
            "404": { description: "Payment not found" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/payments/{id}/capture": {
        post: {
          summary: "Capture authorized payment",
          tags: ["Payments"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "Payment captured" },
            "400": { description: "Invalid payment state" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/payments/{id}/3ds/authenticate": {
        post: {
          summary: "Submit 3DS authentication result",
          tags: ["Payments"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "Payment 3DS metadata updated" },
            "401": { description: "Unauthorized" },
            "404": { description: "Payment not found" }
          }
        }
      },
      "/payments/{id}/3ds/initiate": {
        post: {
          summary: "Initiate 3DS challenge flow",
          tags: ["Payments"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "3DS challenge initialized" },
            "401": { description: "Unauthorized" },
            "404": { description: "Payment not found" }
          }
        }
      },
      "/payments/{id}/refund": {
        post: {
          summary: "Create refund for a payment",
          tags: ["Payments"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RefundRequest" } }
            }
          },
          responses: {
            "201": { description: "Refund created" },
            "400": { description: "Validation or business rule error" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/payments/{id}/routing": {
        get: {
          summary: "Get routing explainability details for payment",
          tags: ["Payments"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "Routing decision details" },
            "401": { description: "Unauthorized" },
            "404": { description: "Payment not found" }
          }
        }
      },
      "/refunds": {
        get: {
          summary: "List refunds",
          tags: ["Payments"],
          security: apiKeyAuth,
          responses: { "200": { description: "Refund list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/customers": {
        post: {
          summary: "Create customer",
          tags: ["Customers"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateCustomerRequest" } }
            }
          },
          responses: {
            "201": { description: "Customer created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List customers",
          tags: ["Customers"],
          security: apiKeyAuth,
          responses: { "200": { description: "Customers list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/customers/{id}": {
        get: {
          summary: "Get customer by ID",
          tags: ["Customers"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "Customer details" },
            "404": { description: "Customer not found" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/subscriptions/plans": {
        post: {
          summary: "Create subscription plan",
          tags: ["Subscriptions"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateSubscriptionPlanRequest" } }
            }
          },
          responses: {
            "201": { description: "Plan created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List subscription plans",
          tags: ["Subscriptions"],
          security: apiKeyAuth,
          responses: { "200": { description: "Plan list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/subscriptions": {
        post: {
          summary: "Create subscription",
          tags: ["Subscriptions"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreateSubscriptionRequest" } }
            }
          },
          responses: {
            "201": { description: "Subscription created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List subscriptions",
          tags: ["Subscriptions"],
          security: apiKeyAuth,
          responses: { "200": { description: "Subscriptions list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/subscriptions/{id}": {
        get: {
          summary: "Get subscription by ID",
          tags: ["Subscriptions"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "Subscription details" },
            "404": { description: "Subscription not found" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/payment-links": {
        post: {
          summary: "Create payment link",
          tags: ["Payment Links"],
          security: apiKeyAuth,
          responses: {
            "201": { description: "Payment link created" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List payment links",
          tags: ["Payment Links"],
          security: apiKeyAuth,
          responses: { "200": { description: "Payment link list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/payment-links/{token}": {
        get: {
          summary: "Get payment link by token",
          tags: ["Payment Links"],
          responses: { "200": { description: "Payment link details" }, "404": { description: "Not found" } }
        },
        post: {
          summary: "Create payment from link token",
          tags: ["Payment Links"],
          responses: {
            "201": { description: "Payment created from link" },
            "404": { description: "Link not found" },
            "409": { description: "Expired or exhausted link" }
          }
        }
      },
      "/payment-methods": {
        post: {
          summary: "Create payment method token",
          tags: ["Payment Methods"],
          security: apiKeyAuth,
          responses: { "201": { description: "Payment method created" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List payment methods",
          tags: ["Payment Methods"],
          security: apiKeyAuth,
          responses: { "200": { description: "Payment methods list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/payment-methods/wallets": {
        post: {
          summary: "Create mobile wallet payment session",
          tags: ["Payment Methods"],
          security: apiKeyAuth,
          responses: { "201": { description: "Wallet session created" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List wallet sessions",
          tags: ["Payment Methods"],
          security: apiKeyAuth,
          responses: { "200": { description: "Wallet session list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/payment-methods/wallets/{id}/authorize": {
        post: {
          summary: "Authorize mobile wallet session",
          tags: ["Payment Methods"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["paymentToken"],
                  properties: {
                    paymentToken: { type: "string", minLength: 12 },
                    signature: { type: "string", minLength: 8 }
                  }
                }
              }
            }
          },
          responses: { "200": { description: "Wallet session authorized" }, "404": { description: "Not found" } }
        }
      },
      "/invoices": {
        post: {
          summary: "Create invoice",
          tags: ["Invoices"],
          security: apiKeyAuth,
          responses: { "201": { description: "Invoice created" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List invoices",
          tags: ["Invoices"],
          security: apiKeyAuth,
          responses: { "200": { description: "Invoices list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/invoices/{id}": {
        post: {
          summary: "Update invoice status",
          tags: ["Invoices"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: { "200": { description: "Invoice updated" }, "404": { description: "Not found" } }
        }
      },
      "/settlements": {
        post: {
          summary: "Create settlement request",
          tags: ["Settlements"],
          security: apiKeyAuth,
          responses: { "201": { description: "Settlement created" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List settlements",
          tags: ["Settlements"],
          security: apiKeyAuth,
          responses: { "200": { description: "Settlements list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/settlements/process": {
        post: {
          summary: "Process due settlements",
          tags: ["Settlements"],
          parameters: [
            {
              name: "x-worker-secret",
              in: "header",
              required: true,
              schema: { type: "string" }
            }
          ],
          responses: { "200": { description: "Settlement processing summary" } }
        }
      },
      "/marketplace/sub-merchants": {
        post: {
          summary: "Create sub-merchant",
          tags: ["Marketplace"],
          security: apiKeyAuth,
          responses: { "201": { description: "Sub-merchant created" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List sub-merchants",
          tags: ["Marketplace"],
          security: apiKeyAuth,
          responses: { "200": { description: "Sub-merchant list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/marketplace/splits/preview": {
        post: {
          summary: "Preview split allocations for a payment",
          tags: ["Marketplace"],
          security: apiKeyAuth,
          responses: { "200": { description: "Split preview" }, "401": { description: "Unauthorized" } }
        }
      },
      "/marketplace/splits/execute": {
        post: {
          summary: "Execute split transfers",
          tags: ["Marketplace"],
          security: apiKeyAuth,
          responses: { "200": { description: "Split transfers executed" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List split transfers",
          tags: ["Marketplace"],
          security: apiKeyAuth,
          responses: { "200": { description: "Split transfer list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/disputes": {
        post: {
          summary: "Create dispute",
          tags: ["Disputes"],
          security: apiKeyAuth,
          responses: {
            "201": { description: "Dispute created" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List disputes",
          tags: ["Disputes"],
          security: apiKeyAuth,
          responses: { "200": { description: "Disputes list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/disputes/{id}": {
        get: {
          summary: "Get dispute by ID",
          tags: ["Disputes"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: { "200": { description: "Dispute details" }, "404": { description: "Not found" } }
        },
        post: {
          summary: "Update dispute status/evidence",
          tags: ["Disputes"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: { "200": { description: "Dispute updated" }, "404": { description: "Not found" } }
        }
      },
      "/subscriptions/cycles/process": {
        post: {
          summary: "Process due subscription billing cycles for authenticated merchant",
          tags: ["Subscriptions"],
          security: apiKeyAuth,
          responses: {
            "200": { description: "Cycle processing summary" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/webhooks/endpoints": {
        post: {
          summary: "Register webhook endpoint",
          tags: ["Webhooks"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/RegisterWebhookEndpointRequest" } }
            }
          },
          responses: {
            "201": { description: "Webhook endpoint registered" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List webhook endpoints",
          tags: ["Webhooks"],
          security: apiKeyAuth,
          responses: { "200": { description: "Endpoints list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/webhooks/endpoints/{id}": {
        patch: {
          summary: "Update webhook endpoint",
          tags: ["Webhooks"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    url: { type: "string", format: "uri" },
                    isActive: { type: "boolean" }
                  }
                }
              }
            }
          },
          responses: {
            "200": { description: "Webhook endpoint updated" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        },
        delete: {
          summary: "Delete webhook endpoint",
          tags: ["Webhooks"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: {
            "200": { description: "Webhook endpoint deleted" },
            "401": { description: "Unauthorized" },
            "404": { description: "Endpoint not found" }
          }
        }
      },
      "/webhooks": {
        post: {
          summary: "Emit webhook event",
          tags: ["Webhooks"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/EmitWebhookEventRequest" } }
            }
          },
          responses: {
            "201": { description: "Webhook event emitted" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        },
        get: {
          summary: "List webhook deliveries",
          tags: ["Webhooks"],
          security: apiKeyAuth,
          responses: { "200": { description: "Delivery list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/webhooks/retries/process": {
        post: {
          summary: "Process failed webhook retries",
          tags: ["Webhooks"],
          security: apiKeyAuth,
          responses: {
            "200": { description: "Retry process completed" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/fraud/alerts": {
        get: {
          summary: "List fraud alerts",
          tags: ["Fraud"],
          security: apiKeyAuth,
          responses: { "200": { description: "Fraud alerts list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/fraud/rules": {
        post: {
          summary: "Create fraud rule",
          tags: ["Fraud"],
          security: apiKeyAuth,
          responses: { "201": { description: "Rule created" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List fraud rules",
          tags: ["Fraud"],
          security: apiKeyAuth,
          responses: { "200": { description: "Rules list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/fraud/rules/{id}": {
        post: {
          summary: "Update fraud rule",
          tags: ["Fraud"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: { "200": { description: "Rule updated" }, "404": { description: "Not found" } }
        }
      },
      "/analytics/overview": {
        get: {
          summary: "Analytics overview",
          tags: ["Analytics"],
          security: apiKeyAuth,
          responses: { "200": { description: "Analytics summary" }, "401": { description: "Unauthorized" } }
        }
      },
      "/analytics/method-performance": {
        get: {
          summary: "Payment method and processor performance metrics",
          tags: ["Analytics"],
          security: apiKeyAuth,
          responses: { "200": { description: "Performance metrics" }, "401": { description: "Unauthorized" } }
        }
      },
      "/analytics/cashflow/forecast": {
        get: {
          summary: "Predictive cashflow forecast",
          tags: ["Analytics"],
          security: apiKeyAuth,
          responses: { "200": { description: "Cashflow forecast" }, "401": { description: "Unauthorized" } }
        }
      },
      "/optimization/recommendations": {
        get: {
          summary: "AI-powered payment routing recommendations",
          tags: ["Optimization"],
          security: apiKeyAuth,
          responses: { "200": { description: "Optimization recommendations" }, "401": { description: "Unauthorized" } }
        }
      },
      "/graphql": {
        post: {
          summary: "GraphQL gateway endpoint",
          tags: ["GraphQL"],
          security: apiKeyAuth,
          responses: { "200": { description: "GraphQL response" }, "401": { description: "Unauthorized" } }
        }
      },
      "/payments/crypto/quote": {
        post: {
          summary: "Create cryptocurrency payment quote",
          tags: ["Crypto"],
          security: apiKeyAuth,
          responses: { "201": { description: "Crypto quote created" }, "401": { description: "Unauthorized" } }
        }
      },
      "/payments/crypto/confirm": {
        post: {
          summary: "Confirm cryptocurrency payment quote",
          tags: ["Crypto"],
          security: apiKeyAuth,
          responses: { "200": { description: "Crypto payment confirmed" }, "401": { description: "Unauthorized" } }
        }
      },
      "/experiments": {
        post: {
          summary: "Create A/B experiment",
          tags: ["Experiments"],
          security: apiKeyAuth,
          responses: { "201": { description: "Experiment created" }, "401": { description: "Unauthorized" } }
        },
        get: {
          summary: "List A/B experiments",
          tags: ["Experiments"],
          security: apiKeyAuth,
          responses: { "200": { description: "Experiment list" }, "401": { description: "Unauthorized" } }
        }
      },
      "/experiments/{id}/assign": {
        post: {
          summary: "Assign subject to experiment variant",
          tags: ["Experiments"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          responses: { "200": { description: "Variant assignment" }, "401": { description: "Unauthorized" } }
        }
      },
      "/compliance/reports": {
        get: {
          summary: "Generate compliance framework report",
          tags: ["Compliance"],
          security: apiKeyAuth,
          responses: { "200": { description: "Compliance report" }, "401": { description: "Unauthorized" } }
        }
      },
      "/pricing/recommendation": {
        post: {
          summary: "Get dynamic pricing recommendation",
          tags: ["Pricing"],
          security: apiKeyAuth,
          responses: { "200": { description: "Pricing recommendation" }, "401": { description: "Unauthorized" } }
        }
      },
      "/payment-preferences": {
        get: {
          summary: "Get merchant allowed payment types",
          tags: ["Payments"],
          security: apiKeyAuth,
          responses: { "200": { description: "Payment preference settings" }, "401": { description: "Unauthorized" } }
        },
        patch: {
          summary: "Update merchant allowed payment types",
          tags: ["Payments"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdatePaymentPreferencesRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Payment preferences updated" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/notifications": {
        get: {
          summary: "List merchant notifications",
          tags: ["Notifications"],
          security: apiKeyAuth,
          responses: { "200": { description: "Notification list" }, "401": { description: "Unauthorized" } }
        },
        post: {
          summary: "Create merchant notification",
          tags: ["Notifications"],
          security: apiKeyAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateNotificationRequest" }
              }
            }
          },
          responses: {
            "201": { description: "Notification created" },
            "400": { description: "Validation error" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/notifications/{id}": {
        patch: {
          summary: "Update notification status",
          tags: ["Notifications"],
          security: apiKeyAuth,
          parameters: [idPathParam],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateNotificationRequest" }
              }
            }
          },
          responses: {
            "200": { description: "Notification updated" },
            "404": { description: "Notification not found" },
            "401": { description: "Unauthorized" }
          }
        }
      },
      "/reporting/summary": {
        get: {
          summary: "Payments reporting summary",
          tags: ["Reporting"],
          security: apiKeyAuth,
          responses: { "200": { description: "Summary report" }, "401": { description: "Unauthorized" } }
        }
      },
      "/reporting/transactions/export": {
        get: {
          summary: "Export transactions CSV",
          tags: ["Reporting"],
          security: apiKeyAuth,
          responses: { "200": { description: "CSV payload" }, "401": { description: "Unauthorized" } }
        }
      },
      "/stream/transactions": {
        get: {
          summary: "SSE stream of transaction updates",
          tags: ["Streaming"],
          security: apiKeyAuth,
          responses: { "200": { description: "Event stream" }, "401": { description: "Unauthorized" } }
        }
      },
      "/sandbox/cards": {
        get: {
          summary: "List sandbox test cards",
          tags: ["Sandbox"],
          responses: { "200": { description: "Sandbox cards list" } }
        }
      },
      "/dashboard/payments": {
        post: {
          summary: "Create payment from dashboard session",
          tags: ["Dashboard"],
          security: dashboardCookieAuth,
          requestBody: {
            required: true,
            content: {
              "application/json": { schema: { $ref: "#/components/schemas/CreatePaymentRequest" } }
            }
          },
          responses: {
            "201": { description: "Payment created" },
            "401": { description: "Missing/invalid dashboard session" }
          }
        }
      },
      "/internal/worker/process": {
        post: {
          summary: "Run webhook retries and subscription billing background cycle",
          tags: ["Workers"],
          parameters: [
            {
              name: "x-worker-secret",
              in: "header",
              required: true,
              schema: { type: "string" },
              description: "Internal worker shared secret."
            }
          ],
          responses: {
            "200": { description: "Worker cycle summary" },
            "401": { description: "Invalid worker secret" },
            "500": { description: "Worker secret not configured" }
          }
        }
      }
    }
  };
}
