import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/store/database";
import { authenticateMerchantByApiKey, registerMerchant } from "@/lib/services/auth-service";
import { createNotification, listNotifications, updateNotification } from "@/lib/services/notification-service";

describe("notification service", () => {
  beforeEach(() => {
    resetDb();
  });

  it("creates and lists notifications", async () => {
    const { apiKey } = await registerMerchant({
      email: "notify1@payforge.dev",
      name: "Notify Merchant"
    });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const first = await createNotification(merchant, {
      channel: "dashboard",
      title: "Payout Ready",
      message: "Your payout batch is ready for transfer."
    });
    const second = await createNotification(merchant, {
      channel: "email",
      title: "Chargeback Opened",
      message: "A new chargeback case requires your attention."
    });

    const notifications = await listNotifications(merchant);
    expect(notifications).toHaveLength(2);
    const ids = new Set(notifications.map((item) => item.id));
    expect(ids.has(first.id)).toBe(true);
    expect(ids.has(second.id)).toBe(true);
  });

  it("updates a notification status to read", async () => {
    const { apiKey } = await registerMerchant({
      email: "notify2@payforge.dev",
      name: "Notify Merchant 2"
    });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    const created = await createNotification(merchant, {
      channel: "dashboard",
      title: "Settlement Reminder",
      message: "Your settlement window closes in 2 hours."
    });
    const updated = await updateNotification(merchant, created.id, { status: "read" });

    expect(updated.status).toBe("read");
    expect(updated.readAt).not.toBeNull();
  });

  it("throws when notification does not exist", async () => {
    const { apiKey } = await registerMerchant({
      email: "notify3@payforge.dev",
      name: "Notify Merchant 3"
    });
    const merchant = await authenticateMerchantByApiKey(apiKey);
    if (!merchant) {
      throw new Error("missing_merchant");
    }

    await expect(
      updateNotification(merchant, "00000000-0000-0000-0000-000000000000", {
        status: "read"
      })
    ).rejects.toThrowError("notification_not_found");
  });
});
