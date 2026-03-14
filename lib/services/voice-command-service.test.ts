import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { executeVoicePaymentCommand } from "@/lib/services/voice-command-service";
import { capturePayment, createPayment } from "@/lib/services/payment-service";

describe("voice command service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates payment from transcript command", async () => {
    const { apiKey } = await registerMerchant({ email: "voice-create@acme.com", name: "Voice Create" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const result = await executeVoicePaymentCommand(merchant, {
      source: "text",
      transcript: "charge 12.34 usd",
      metadata: {}
    });

    expect(result.interpretedIntent).toBe("create_payment");
    expect(result.payment?.amount).toBe(1234);
    expect(result.payment?.currency).toBe("USD");
    expect(result.payment?.metadata.commandSource).toBe("voice");
  });

  it("refunds succeeded payment from transcript command", async () => {
    const { apiKey } = await registerMerchant({ email: "voice-refund@acme.com", name: "Voice Refund" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const payment = await createPayment(merchant, {
      amount: 4500,
      currency: "USD",
      metadata: {}
    });
    await capturePayment(merchant, payment.id);

    const result = await executeVoicePaymentCommand(merchant, {
      source: "text",
      transcript: `refund ${payment.id} 10.00 usd for duplicate charge`,
      metadata: {}
    });

    expect(result.interpretedIntent).toBe("refund_payment");
    expect(result.refund?.amount).toBe(1000);
    expect(result.refund?.reason).toBe("duplicate charge");
  });

  it("returns validation-style app error when command is not understood", async () => {
    const { apiKey } = await registerMerchant({ email: "voice-unknown@acme.com", name: "Voice Unknown" });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await expect(
      executeVoicePaymentCommand(merchant, {
        source: "text",
        transcript: "hello dashboard",
        metadata: {}
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "voice_command_unrecognized"
    });
  });
});
