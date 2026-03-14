import { randomUUID } from "node:crypto";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    provider?: string;
    amount?: number;
    currency?: string;
    destination?: string;
    method?: string;
  };

  await wait(120 + Math.floor(Math.random() * 220));

  const amount = Number(payload.amount ?? 0);
  const provider = payload.provider ?? "mock_bank_ach";
  const baseFailureRate = provider === "razorpayx" || provider === "mock_rtp" ? 0.06 : 0.03;
  const highValuePenalty = amount >= 200_000 ? 0.04 : 0;
  const fail = Math.random() < baseFailureRate + highValuePenalty;

  if (fail) {
    return Response.json(
      { ok: false, failureReason: "upstream_payout_declined" },
      { status: 502 }
    );
  }

  return Response.json({
    ok: true,
    providerReference: `${provider}_${randomUUID().slice(0, 14)}`
  });
}
