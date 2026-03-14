import { randomBytes } from "node:crypto";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    provider?: string;
    paymentToken?: string;
  };

  await wait(80 + Math.floor(Math.random() * 180));

  if (!payload.paymentToken || payload.paymentToken.length < 12) {
    return Response.json({ ok: false, error: "invalid_wallet_token" }, { status: 400 });
  }

  const providerPenalty = payload.provider === "google_pay" ? 0.01 : 0;
  const fail = Math.random() < 0.02 + providerPenalty;

  if (fail) {
    return Response.json({ ok: false, error: "wallet_authorization_declined" }, { status: 402 });
  }

  return Response.json({
    ok: true,
    authToken: `wlt_auth_${randomBytes(10).toString("hex")}`
  });
}
