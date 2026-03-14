const ERROR_MESSAGE_MAP: Record<string, string> = {
  merchant_already_exists: "A merchant account with this email already exists.",
  login_failed: "Unable to sign in. Please check your API key.",
  register_failed: "Unable to create account. Please try again.",
  invalid_api_key: "The API key is invalid.",
  unauthorized: "You are not authorized to perform this action.",
  validation_error: "Some input values are invalid. Please check and try again.",
  rate_limit_exceeded: "Too many requests. Please wait a moment and try again.",
  copy_failed: "Could not copy API key automatically. Please copy it manually.",
  unsupported_currency: "This currency is not supported for this operation.",
  payment_not_found: "Payment not found.",
  subscription_not_found: "Subscription not found."
};

function sentenceCaseFromCode(code: string) {
  const words = code
    .replace(/[^a-zA-Z0-9_]/g, "")
    .split("_")
    .filter(Boolean);
  if (words.length === 0) {
    return "Something went wrong. Please try again.";
  }

  const sentence = words.join(" ");
  return sentence.charAt(0).toUpperCase() + sentence.slice(1) + ".";
}

export function toReadableErrorMessage(errorCode: string | null | undefined) {
  if (!errorCode) {
    return "Something went wrong. Please try again.";
  }
  const normalized = String(errorCode).trim().toLowerCase();
  return ERROR_MESSAGE_MAP[normalized] ?? sentenceCaseFromCode(normalized);
}
