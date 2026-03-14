"use client";

import { useMemo, useState } from "react";

export function UniversalCheckout() {
  const [amount, setAmount] = useState(1000);
  const [currency, setCurrency] = useState("USD");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>("");

  const amountLabel = useMemo(() => `${amount} ${currency}`, [amount, currency]);

  async function handleCreateIntent() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/dashboard/payments", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ amount, currency, metadata: { source: "checkout_widget" } })
      });

      const json = await response.json();
      if (!response.ok) {
        setResult(`Error: ${json.error ?? "unknown"}`);
        return;
      }

      setResult(`Created ${json.id} | ${json.status}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="glass rounded-2xl p-5">
      <h3 className="text-lg font-semibold">Universal Checkout</h3>
      <p className="mt-1 text-sm text-slate-600">Fast embedded widget for test payment intents.</p>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_120px_1fr]">
        <input
          className="rounded-xl border border-slate-300 bg-white px-3 py-2"
          min={1}
          onChange={(event) => setAmount(Number(event.target.value) || 1)}
          type="number"
          value={amount}
        />
        <select
          className="rounded-xl border border-slate-300 bg-white px-3 py-2"
          onChange={(event) => setCurrency(event.target.value.toUpperCase())}
          value={currency}
        >
          <option value="USD">USD</option>
          <option value="INR">INR</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </select>
        <button
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          disabled={isLoading}
          onClick={handleCreateIntent}
          type="button"
        >
          {isLoading ? "Creating..." : `Pay ${amountLabel}`}
        </button>
      </div>

      {result ? <p className="mt-3 text-sm text-slate-700">{result}</p> : null}
    </section>
  );
}
