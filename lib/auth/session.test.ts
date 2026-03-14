import { describe, expect, it } from "vitest";
import { createDashboardSessionToken, verifyDashboardSessionToken } from "@/lib/auth/session";

describe("dashboard session token", () => {
  it("creates and verifies signed token", () => {
    const token = createDashboardSessionToken(
      {
        id: "merchant-123",
        email: "merchant@example.com",
        name: "Acme",
        apiKeyHash: "hash",
        createdAt: new Date().toISOString()
      },
      60
    );
    const payload = verifyDashboardSessionToken(token);

    expect(payload?.merchant.id).toBe("merchant-123");
  });

  it("rejects invalid token signature", () => {
    const token = createDashboardSessionToken(
      {
        id: "merchant-123",
        email: "merchant@example.com",
        name: "Acme",
        apiKeyHash: "hash",
        createdAt: new Date().toISOString()
      },
      60
    );
    const [payload] = token.split(".");
    const tampered = `${payload}.invalid`;

    expect(verifyDashboardSessionToken(tampered)).toBeNull();
  });
});
