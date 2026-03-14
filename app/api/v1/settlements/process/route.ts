import { jsonError, jsonOk } from "@/lib/api/http";
import { processSettlements } from "@/lib/services/settlement-service";
import { headers } from "next/headers";
import { AppError } from "@/lib/api/errors";

function assertWorkerSecret(secret: string | null) {
  const configured = process.env.NEXTPAY_WORKER_SECRET;
  if (!configured) {
    throw new AppError(500, "worker_secret_not_configured");
  }
  if (!secret || secret !== configured) {
    throw new AppError(401, "invalid_worker_secret");
  }
}

export async function POST() {
  try {
    const headerStore = await headers();
    assertWorkerSecret(headerStore.get("x-worker-secret"));
    const processed = await processSettlements();
    return jsonOk({ processed: processed.length });
  } catch (error) {
    return jsonError(error);
  }
}
