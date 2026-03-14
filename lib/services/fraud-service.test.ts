import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { assessFraudRisk, listFraudAlerts } from "@/lib/services/fraud-service";

describe("fraud service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("returns low score for normal payment", async () => {
    const assessment = await assessFraudRisk({
      merchantId: "merchant-1",
      paymentId: "payment-1",
      amount: 5000,
      currency: "USD"
    });

    expect(assessment.riskScore).toBeLessThan(50);
  });

  it("stores fraud alert for risky payment", async () => {
    const { apiKey } = await registerMerchant({ email: "fraud@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await assessFraudRisk({
      merchantId: merchant.id,
      paymentId: "payment-risky",
      amount: 250000,
      currency: "XYZ"
    });

    const alerts = await listFraudAlerts(merchant);
    expect(alerts.length).toBeGreaterThan(0);
  });
});
