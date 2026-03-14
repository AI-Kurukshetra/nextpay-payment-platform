export type Processor = "stripe" | "adyen" | "razorpay" | "bank_gateway" | "crypto_processor";

const processorScores: Record<Processor, number> = {
  stripe: 98,
  adyen: 95,
  razorpay: 94,
  bank_gateway: 90,
  crypto_processor: 88
};

type RouteDecision = {
  processor: Processor;
  mode: "auto" | "manual";
  routeType: "card" | "bank" | "crypto";
  reason: string;
  candidates: Array<{ processor: Processor; score: number }>;
};

export function routePaymentDecision(input: {
  currency: string;
  amount: number;
  routingMode?: "auto" | "manual";
  routeType?: "card" | "bank" | "crypto";
  preferredProcessor?: Processor;
}): RouteDecision {
  const mode = input.routingMode ?? "auto";
  const routeType = input.routeType ?? "card";

  if (mode === "manual" && input.preferredProcessor) {
    return {
      processor: input.preferredProcessor,
      mode,
      routeType,
      reason: "manual_selection",
      candidates: [{ processor: input.preferredProcessor, score: 100 }]
    };
  }

  if (routeType === "bank") {
    return {
      processor: "bank_gateway",
      mode,
      routeType,
      reason: "route_type_bank",
      candidates: [{ processor: "bank_gateway", score: 100 }]
    };
  }

  if (routeType === "crypto") {
    return {
      processor: "crypto_processor",
      mode,
      routeType,
      reason: "route_type_crypto",
      candidates: [{ processor: "crypto_processor", score: 100 }]
    };
  }

  const currency = input.currency.toUpperCase();
  const isIndia = currency === "INR";
  const isHighValue = input.amount >= 100_000;

  const candidates: Array<{ processor: Processor; score: number }> = [
    { processor: "stripe", score: processorScores.stripe - (isIndia ? 4 : 0) - (isHighValue ? 1 : 0) },
    { processor: "adyen", score: processorScores.adyen - (isIndia ? 3 : 0) + (isHighValue ? 2 : 0) },
    { processor: "razorpay", score: processorScores.razorpay + (isIndia ? 8 : -4) - (isHighValue ? 2 : 0) }
  ];
  candidates.sort((a, b) => b.score - a.score);
  const selected = candidates[0]?.processor ?? "stripe";

  const reason = isIndia
    ? "currency_local_optimization"
    : isHighValue
      ? "high_value_success_optimization"
      : "default_success_optimization";

  return {
    processor: selected,
    mode,
    routeType,
    reason,
    candidates
  };
}

export function routePaymentProcessor(input: {
  currency: string;
  amount: number;
  routingMode?: "auto" | "manual";
  routeType?: "card" | "bank" | "crypto";
  preferredProcessor?: Processor;
}) {
  return routePaymentDecision(input).processor;
}
