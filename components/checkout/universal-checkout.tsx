"use client";

import { useMemo, useState } from "react";
import { getSupportedCurrencies } from "@/lib/services/currency-catalog";
import { toReadableErrorMessage } from "@/lib/ui/error-message";

const CURRENCIES = getSupportedCurrencies();

export function UniversalCheckout() {
  const [amount, setAmount] = useState(1000);
  const [currency, setCurrency] = useState("USD");
  const [routingMode, setRoutingMode] = useState<"auto" | "manual">("auto");
  const [routeType, setRouteType] = useState<"card" | "bank" | "crypto">("card");
  const [preferredProcessor, setPreferredProcessor] = useState<
    "stripe" | "adyen" | "razorpay" | "bank_gateway" | "crypto_processor"
  >("stripe");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const amountLabel = useMemo(() => `${amount} ${currency}`, [amount, currency]);

  function processorOptions(type: "card" | "bank" | "crypto") {
    if (type === "bank") {
      return [{ value: "bank_gateway", label: "Bank Gateway" }] as const;
    }
    if (type === "crypto") {
      return [{ value: "crypto_processor", label: "Crypto Processor" }] as const;
    }
    return [
      { value: "stripe", label: "Stripe" },
      { value: "adyen", label: "Adyen" },
      { value: "razorpay", label: "Razorpay" }
    ] as const;
  }

  function handleRouteTypeChange(nextType: "card" | "bank" | "crypto") {
    setRouteType(nextType);
    const options = processorOptions(nextType);
    setPreferredProcessor(options[0].value);
  }

  async function handleCreateIntent() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/dashboard/payments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          amount,
          currency,
          metadata: { source: "checkout_widget" },
          routingMode,
          ...(routingMode === "manual" ? { routeType, preferredProcessor } : {})
        })
      });

      const json = await response.json();
      if (!response.ok) {
        setResult(`Error: ${toReadableErrorMessage(json.error ?? "unknown")}`);
        return;
      }

      setResult(`Created ${json.id} | ${json.status}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-semibold">Universal Checkout</h3>
          <p className="mt-1 text-sm text-slate-600">Responsive test checkout with auto/manual processor routing.</p>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">Device-ready</span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Amount (minor unit)</span>
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
            min={1}
            onChange={(event) => setAmount(Number(event.target.value) || 1)}
            type="number"
            value={amount}
          />
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Currency</span>
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
            onChange={(event) => setCurrency(event.target.value.toUpperCase())}
            value={currency}
          >
            {CURRENCIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm">
          <span className="text-slate-600">Routing Mode</span>
          <select
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
            onChange={(event) => setRoutingMode(event.target.value as "auto" | "manual")}
            value={routingMode}
          >
            <option value="auto">Auto Route</option>
            <option value="manual">Manual Route</option>
          </select>
        </label>

        {routingMode === "manual" ? (
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Route Type (Manual)</span>
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2"
              onChange={(event) => handleRouteTypeChange(event.target.value as "card" | "bank" | "crypto")}
              value={routeType}
            >
              <option value="card">Card Processor</option>
              <option value="bank">Bank Gateway</option>
              <option value="crypto">Crypto Processor</option>
            </select>
          </label>
        ) : null}

        {routingMode === "manual" && routeType === "card" ? (
          <label className="grid gap-1 text-sm">
            <span className="text-slate-600">Processor (Manual)</span>
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2"
              onChange={(event) =>
                setPreferredProcessor(
                  event.target.value as "stripe" | "adyen" | "razorpay" | "bank_gateway" | "crypto_processor"
                )
              }
              value={preferredProcessor}
            >
              {processorOptions(routeType).map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-600">
          Total: <span className="font-medium text-slate-800">{amountLabel}</span>
        </p>
        <button
          className="w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60 sm:w-auto"
          disabled={isLoading}
          onClick={handleCreateIntent}
          type="button"
        >
          {isLoading ? "Creating..." : `Pay ${amountLabel}`}
        </button>
      </div>

      {result ? (
        <p className="mt-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
          {result}
        </p>
      ) : null}
    </section>
  );
}
