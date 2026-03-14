import { describe, expect, it } from "vitest";
import { createPaymentSchema, refundPaymentSchema } from "@/lib/validations/payment";

describe("payment schemas", () => {
  it("accepts valid payment input", () => {
    const result = createPaymentSchema.safeParse({
      amount: 1200,
      currency: "USD",
      metadata: { source: "api" }
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid refund", () => {
    const result = refundPaymentSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });
});
