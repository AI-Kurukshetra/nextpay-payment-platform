import { createHash, createHmac, randomBytes } from "node:crypto";

export function hashSecret(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateApiKey(): string {
  return `np_live_${randomBytes(24).toString("hex")}`;
}

export function generateWebhookSecret(): string {
  return `whsec_${randomBytes(24).toString("hex")}`;
}

export function signPayload(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

export function safeCompare(a: string, b: string): boolean {
  return a.length === b.length && a === b;
}
