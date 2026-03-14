type HttpMethod = "get" | "post";

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
      title: "NextPay API",
      version: "1.0.0",
      description: "Developer-first payment gateway API documentation."
    },
    servers: [{ url: `${origin}/api/v1` }],
    tags: [
      { name: "Auth", description: "Merchant authentication and dashboard session endpoints." },
      { name: "Payments", description: "Payment creation, retrieval, capture, and refunds." },
      { name: "Customers", description: "Customer CRUD-lite endpoints." },
      { name: "Subscriptions", description: "Plan and subscription management." },
      { name: "Webhooks", description: "Webhook endpoint/event/retry operations." },
      { name: "Fraud", description: "Fraud alert access." },
      { name: "Analytics", description: "Dashboard analytics overview." },
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
          name: "nextpay_dashboard_session",
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
      "/analytics/overview": {
        get: {
          summary: "Analytics overview",
          tags: ["Analytics"],
          security: apiKeyAuth,
          responses: { "200": { description: "Analytics summary" }, "401": { description: "Unauthorized" } }
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
