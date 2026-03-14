import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import {
  createSubscription,
  createSubscriptionPlan,
  listSubscriptionPlans,
  processSubscriptionBillingCycles
} from "@/lib/services/subscription-service";

describe("subscription service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates subscription plan", async () => {
    const { apiKey } = await registerMerchant({ email: "sub@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await createSubscriptionPlan(merchant, {
      name: "Pro",
      amount: 2500,
      currency: "USD",
      interval: "month",
      trialDays: 14
    });

    const plans = await listSubscriptionPlans(merchant);
    expect(plans).toHaveLength(1);
  });

  it("creates subscription", async () => {
    const { apiKey } = await registerMerchant({ email: "sub2@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }
    const plan = await createSubscriptionPlan(merchant, {
      name: "Growth",
      amount: 4900,
      currency: "INR",
      interval: "month",
      trialDays: 0
    });

    const sub = await createSubscription(merchant, {
      customerId: "17f03033-c0a8-4e79-bf57-fa438977f6dc",
      planId: plan.id
    });

    expect(sub.planId).toBe(plan.id);
  });

  it("processes due subscription billing cycles", async () => {
    const { apiKey } = await registerMerchant({ email: "bill@acme.com", name: "Acme Billing" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const plan = await createSubscriptionPlan(merchant, {
      name: "Monthly",
      amount: 2000,
      currency: "USD",
      interval: "month",
      trialDays: 0
    });

    const subscription = await createSubscription(merchant, {
      customerId: "17f03033-c0a8-4e79-bf57-fa438977f6dc",
      planId: plan.id
    });

    subscription.nextBillingAt = new Date(Date.now() - 60_000).toISOString();

    const result = await processSubscriptionBillingCycles(new Date(), merchant.id);
    expect(result.processed).toBe(1);
    expect(result.charged + result.pastDue).toBe(1);
  });
});
