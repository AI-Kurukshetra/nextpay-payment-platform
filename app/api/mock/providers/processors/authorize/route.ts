import { randomUUID } from "node:crypto";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    processor?: string;
    amount?: number;
    currency?: string;
  };

  await wait(120 + Math.floor(Math.random() * 260));

  const processor = payload.processor ?? "stripe";
  const amount = Number(payload.amount ?? 0);
  const currency = (payload.currency ?? "USD").toUpperCase();

  const baseSuccess: Record<string, number> = {
    stripe: 0.96,
    adyen: 0.95,
    razorpay: currency === "INR" ? 0.97 : 0.9,
    bank_gateway: 0.92,
    crypto_processor: 0.89
  };

  let successRate = baseSuccess[processor] ?? 0.9;
  if (amount >= 120_000) successRate -= 0.05;

  const approved = Math.random() < successRate;
  if (!approved) {
    return Response.json(
      {
        approved: false,
        providerPaymentId: null,
        declineReason: "issuer_declined"
      },
      { status: 402 }
    );
  }

  return Response.json({
    approved: true,
    providerPaymentId: `${processor}_${randomUUID().slice(0, 14)}`,
    declineReason: null
  });
}
