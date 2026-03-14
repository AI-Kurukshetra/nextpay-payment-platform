import { AppError } from "@/lib/api/errors";

const blockedKeys = [
  "card_number",
  "cardnumber",
  "pan",
  "cvv",
  "cvc",
  "security_code",
  "expiry",
  "exp_month",
  "exp_year"
];

function looksLikePan(value: string) {
  return /^\d{13,19}$/.test(value.replace(/\s|-/g, ""));
}

export function assertNoSensitiveCardData(input: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(input)) {
    const normalized = key.toLowerCase();
    if (blockedKeys.includes(normalized)) {
      throw new AppError(400, "pci_sensitive_field_forbidden");
    }
    if (typeof value === "string" && looksLikePan(value)) {
      throw new AppError(400, "pci_raw_pan_forbidden");
    }
  }
}
