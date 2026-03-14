import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { capturePayment, createPayment, getPaymentById } from "@/lib/services/payment-service";

describe("payment service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates authorized payment", async () => {
    const { apiKey } = await registerMerchant({ email: "a@b.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }
    const payment = await createPayment(merchant, {
      amount: 5000,
      currency: "usd",
      metadata: {}
    });

    expect(payment.currency).toBe("USD");
    expect(payment.status).toBe("authorized");
  });

  it("captures authorized payment", async () => {
    const { apiKey } = await registerMerchant({ email: "c@d.com", name: "Acme 2" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }
    const payment = await createPayment(merchant, {
      amount: 3000,
      currency: "INR",
      metadata: {}
    });
    const captured = await capturePayment(merchant, payment.id);

    expect(captured.status).toBe("succeeded");
    const fetched = await getPaymentById(merchant, payment.id);
    expect(fetched.status).toBe("succeeded");
  });
});
