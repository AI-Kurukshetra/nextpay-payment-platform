import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { getAnalyticsOverview } from "@/lib/services/analytics-service";
import { capturePayment, createPayment } from "@/lib/services/payment-service";

describe("analytics service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("computes overview metrics", async () => {
    const { apiKey } = await registerMerchant({ email: "analytics@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }
    const p1 = await createPayment(merchant, { amount: 1000, currency: "USD", metadata: {} });
    const p2 = await createPayment(merchant, { amount: 2000, currency: "USD", metadata: {} });
    await capturePayment(merchant, p1.id);
    await capturePayment(merchant, p2.id);

    const overview = await getAnalyticsOverview(merchant);

    expect(overview.totalPayments).toBe(2);
    expect(overview.totalPaymentVolume).toBe(3000);
  });
});
