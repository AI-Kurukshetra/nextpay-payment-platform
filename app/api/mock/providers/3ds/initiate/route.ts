import { randomUUID } from "node:crypto";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    returnUrl?: string;
  };

  await wait(100 + Math.floor(Math.random() * 220));

  const transactionId = randomUUID();
  const returnUrl = payload.returnUrl ?? "https://merchant.local/return";
  const challengeUrl = `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}three_ds_txn=${transactionId}`;

  return Response.json({ transactionId, challengeUrl });
}
