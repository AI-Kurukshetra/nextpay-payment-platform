import { AppError } from "@/lib/api/errors";

export async function providerPost<TPayload extends Record<string, unknown>, TResult>(
  url: string,
  apiKey: string | undefined,
  payload: TPayload
): Promise<TResult> {
  if (!url) {
    throw new AppError(500, "provider_url_not_configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify(payload)
  });

  const json = (await response.json().catch(() => ({}))) as TResult & { error?: string };
  if (!response.ok) {
    throw new AppError(502, typeof json === "object" && json && "error" in json ? String(json.error) : "provider_error");
  }

  return json;
}
