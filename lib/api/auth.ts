import { headers } from "next/headers";
import { AppError } from "@/lib/api/errors";
import { authenticateMerchantByApiKey } from "@/lib/services/auth-service";

export async function requireMerchant() {
  const headerStore = await headers();
  const apiKey = headerStore.get("x-api-key");

  if (!apiKey) {
    throw new AppError(401, "missing_api_key");
  }

  const merchant = await authenticateMerchantByApiKey(apiKey);
  if (!merchant) {
    throw new AppError(401, "invalid_api_key");
  }

  return merchant;
}
