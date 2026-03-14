import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { createCustomer, getCustomerById, listCustomers } from "@/lib/services/customer-service";

describe("customer service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates and lists customers", async () => {
    const { apiKey } = await registerMerchant({ email: "customer@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await createCustomer(merchant, { email: "john@example.com", name: "John" });
    const customers = await listCustomers(merchant);

    expect(customers).toHaveLength(1);
  });

  it("gets customer by id", async () => {
    const { apiKey } = await registerMerchant({ email: "customer2@acme.com", name: "Acme" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const customer = await createCustomer(merchant, { email: "jane@example.com", name: "Jane" });
    const fetched = await getCustomerById(merchant, customer.id);

    expect(fetched.id).toBe(customer.id);
  });
});
