import { requireMerchant } from "@/lib/api/auth";
import { listLatestPayments } from "@/lib/services/payment-service";

function encodeEvent(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET() {
  const merchant = await requireMerchant();
  const encoder = new TextEncoder();
  let timer: ReturnType<typeof setInterval> | null = null;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let cancelled = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const push = async () => {
        if (cancelled) return;
        const latest = await listLatestPayments(merchant, 15);
        controller.enqueue(
          encoder.encode(
            encodeEvent("transactions", {
              generatedAt: new Date().toISOString(),
              count: latest.length,
              latest
            })
          )
        );
      };

      void push();
      timer = setInterval(() => {
        void push();
      }, 3000);

      // Auto-close after 60 seconds to keep server resources bounded.
      timeout = setTimeout(() => {
        cancelled = true;
        if (timer) clearInterval(timer);
        controller.close();
      }, 60_000);
    },
    cancel() {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (timeout) clearTimeout(timeout);
    }
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive"
    }
  });
}
