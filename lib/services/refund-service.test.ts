import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { capturePayment, createPayment } from "@/lib/services/payment-service";
import { createRefund } from "@/lib/services/refund-service";

describe("refund service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates full refund", async () => {
    const { apiKey } = await registerMerchant({ email: "refund@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }
    const payment = await createPayment(merchant, {
      amount: 1000,
      currency: "USD",
      metadata: {}
    });

    await capturePayment(merchant, payment.id);

    const refund = await createRefund(merchant, payment.id, { amount: 1000, reason: "customer_request" });
    expect(refund.status).toBe("succeeded");
  });

  it("rejects over-refund", async () => {
    const { apiKey } = await registerMerchant({ email: "refund2@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }
    const payment = await createPayment(merchant, {
      amount: 900,
      currency: "USD",
      metadata: {}
    });
    await capturePayment(merchant, payment.id);

    await expect(createRefund(merchant, payment.id, { amount: 1500, reason: "invalid" })).rejects.toThrowError(
      "refund_exceeds_remaining_amount"
    );
  });
});
