import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import {
  authenticateMerchantByApiKey,
  listMerchantApiAuditLogs,
  registerMerchant,
  revokeMerchantApiKey,
  rotateMerchantApiKey
} from "@/lib/services/auth-service";

describe("auth service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("registers merchant and returns api key", async () => {
    const result = await registerMerchant({ email: "ops@acme.com", name: "Acme" });
    expect(result.apiKey.startsWith("np_live_")).toBe(true);
    expect(result.merchant.email).toBe("ops@acme.com");
  });

  it("authenticates with issued api key", async () => {
    const registered = await registerMerchant({ email: "dev@acme.com", name: "Acme Dev" });
    const merchant = await authenticateMerchantByApiKey(registered.apiKey);
    expect(merchant?.id).toBe(registered.merchant.id);
  });

  it("rotates api key and invalidates old one", async () => {
    const registered = await registerMerchant({ email: "rotate@acme.com", name: "Rotate Inc" });
    const merchant = await authenticateMerchantByApiKey(registered.apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const rotated = await rotateMerchantApiKey(merchant, { reason: "security_rotation" });
    const oldKeyAuth = await authenticateMerchantByApiKey(registered.apiKey);
    const newKeyAuth = await authenticateMerchantByApiKey(rotated.apiKey);

    expect(oldKeyAuth).toBeNull();
    expect(newKeyAuth?.id).toBe(merchant.id);
  });

  it("tracks api key audit logs for rotation", async () => {
    const registered = await registerMerchant({ email: "audit@acme.com", name: "Audit Inc" });
    const merchant = await authenticateMerchantByApiKey(registered.apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await rotateMerchantApiKey(merchant, { reason: "routine_rotation" });
    const logs = await listMerchantApiAuditLogs(merchant);
    expect(logs.some((log) => log.action === "api_key_rotated")).toBe(true);
  });

  it("prevents revoking the last active api key", async () => {
    const registered = await registerMerchant({ email: "revoke@acme.com", name: "Revoke Inc" });
    const merchant = await authenticateMerchantByApiKey(registered.apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await expect(
      revokeMerchantApiKey(merchant, { apiKey: registered.apiKey, reason: "cleanup" })
    ).rejects.toThrowError("cannot_revoke_last_active_key");
  });
});
