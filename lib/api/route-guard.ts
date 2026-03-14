import { headers } from "next/headers";
import { AppError } from "@/lib/api/errors";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function enforceRateLimit() {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for") ?? "unknown";
  const key = forwardedFor.split(",")[0]?.trim() ?? "unknown";

  const result = checkRateLimit(key);
  if (!result.allowed) {
    throw new AppError(429, "rate_limit_exceeded");
  }

  return result;
}
