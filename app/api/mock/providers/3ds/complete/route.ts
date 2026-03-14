function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    challengeResult?: "authenticated" | "failed";
  };

  await wait(90 + Math.floor(Math.random() * 180));

  const approved = payload.challengeResult === "authenticated";
  return Response.json({
    approved,
    liabilityShifted: approved
  });
}
