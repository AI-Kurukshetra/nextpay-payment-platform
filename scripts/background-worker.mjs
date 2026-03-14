const baseUrl = process.env.NEXTPAY_BASE_URL ?? "http://localhost:3000";
const workerSecret = process.env.NEXTPAY_WORKER_SECRET;
const intervalMs = Number(process.env.NEXTPAY_WORKER_INTERVAL_MS ?? "60000");

if (!workerSecret) {
  console.error("Missing NEXTPAY_WORKER_SECRET");
  process.exit(1);
}

async function runCycle() {
  const response = await fetch(`${baseUrl}/api/v1/internal/worker/process`, {
    method: "POST",
    headers: {
      "x-worker-secret": workerSecret
    }
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(`worker_cycle_failed: ${JSON.stringify(payload)}`);
  }

  console.log(
    `[worker] ${payload.processedAt} webhooks=${payload.webhooks.processed} subscriptions=${payload.subscriptions.processed}`
  );
}

async function start() {
  console.log(`[worker] starting baseUrl=${baseUrl} intervalMs=${intervalMs}`);
  await runCycle();
  setInterval(() => {
    runCycle().catch((error) => {
      console.error("[worker] cycle error", error.message);
    });
  }, intervalMs);
}

start().catch((error) => {
  console.error("[worker] startup error", error.message);
  process.exit(1);
});
