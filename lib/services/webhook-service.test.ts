import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import {
  deleteWebhookEndpoint,
  emitWebhookEvent,
  listWebhookDeliveries,
  listWebhookEndpoints,
  processWebhookRetries,
  registerWebhookEndpoint,
  updateWebhookEndpoint
} from "@/lib/services/webhook-service";

describe("webhook service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("registers endpoint and emits deliveries", async () => {
    const { apiKey } = await registerMerchant({ email: "webhook@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await registerWebhookEndpoint(merchant, { url: "https://merchant.test/webhooks" });
    await emitWebhookEvent(merchant, { type: "payment.succeeded", payload: { paymentId: "p1" } });

    const deliveries = await listWebhookDeliveries(merchant);
    expect(deliveries.length).toBe(1);
  });

  it("processes webhook retries", async () => {
    const { apiKey } = await registerMerchant({ email: "webhook2@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await registerWebhookEndpoint(merchant, { url: "https://merchant2.test/webhooks" });
    await emitWebhookEvent(merchant, { type: "refund.processed", payload: { refundId: "r1" } });
    const processed = await processWebhookRetries();

    expect(processed.length).toBe(1);
  });

  it("updates and deletes webhook endpoint", async () => {
    const { apiKey } = await registerMerchant({ email: "webhook3@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const endpoint = await registerWebhookEndpoint(merchant, { url: "https://merchant3.test/webhooks" });
    const updated = await updateWebhookEndpoint(merchant, endpoint.id, {
      url: "https://merchant3.test/updated-webhooks",
      isActive: false
    });

    expect(updated.url).toBe("https://merchant3.test/updated-webhooks");
    expect(updated.isActive).toBe(false);

    await deleteWebhookEndpoint(merchant, endpoint.id);
    const endpoints = await listWebhookEndpoints(merchant);
    expect(endpoints.length).toBe(0);
  });
});
