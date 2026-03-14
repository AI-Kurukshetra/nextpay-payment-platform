export type PayForgeClientOptions = {
  apiKey: string;
  baseUrl?: string;
};

export type CreatePaymentRequest = {
  amount: number;
  currency: string;
  customerId?: string;
  settlementCurrency?: string;
  require3ds?: boolean;
  metadata?: Record<string, string>;
};

export class PayForgeClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: PayForgeClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://api.payforge.local/api/v1").replace(/\/$/, "");
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        ...(init?.headers ?? {})
      }
    });

    const json = (await response.json().catch(() => ({}))) as T & { error?: string };
    if (!response.ok) {
      throw new Error(typeof json === "object" && json && "error" in json ? String(json.error) : "payforge_request_failed");
    }

    return json;
  }

  createPayment(input: CreatePaymentRequest) {
    return this.request<Record<string, unknown>>("/payments", {
      method: "POST",
      body: JSON.stringify(input)
    });
  }

  getPayment(id: string) {
    return this.request<Record<string, unknown>>(`/payments/${id}`);
  }

  refundPayment(id: string, amount: number, reason?: string) {
    return this.request<Record<string, unknown>>(`/payments/${id}/refund`, {
      method: "POST",
      body: JSON.stringify({ amount, reason })
    });
  }

  listPayments(query: Record<string, string | number | undefined> = {}) {
    const search = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) search.set(key, String(value));
    });
    const suffix = search.size > 0 ? `?${search.toString()}` : "";
    return this.request<Array<Record<string, unknown>>>(`/payments${suffix}`);
  }
}
