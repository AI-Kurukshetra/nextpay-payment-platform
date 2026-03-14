"use client";

import { useEffect, useState } from "react";

type StreamPayment = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

type StreamPayload = {
  generatedAt: string;
  count: number;
  latest: StreamPayment[];
};

export function LiveTransactions() {
  const [payload, setPayload] = useState<StreamPayload | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const source = new EventSource("/api/v1/dashboard/stream/transactions");
    source.addEventListener("transactions", (event) => {
      const data = JSON.parse((event as MessageEvent<string>).data) as StreamPayload;
      setPayload(data);
      setConnected(true);
    });
    source.onerror = () => {
      setConnected(false);
    };

    return () => {
      source.close();
    };
  }, []);

  return (
    <article className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Live Transactions</h3>
        <span className={`rounded-full px-2 py-1 text-xs ${connected ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
          {connected ? "connected" : "connecting"}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">Real-time stream for latest payment status updates.</p>

      <ul className="mt-4 space-y-2 text-sm">
        {payload?.latest.length ? (
          payload.latest.map((payment) => (
            <li className="rounded-lg bg-white px-3 py-2" key={payment.id}>
              <div className="flex items-center justify-between">
                <span className="font-medium">{payment.id.slice(0, 14)}...</span>
                <span className="text-xs text-slate-500">{payment.status}</span>
              </div>
              <p className="text-xs text-slate-500">
                {payment.currency} {(payment.amount / 100).toFixed(2)} · {new Date(payment.createdAt).toLocaleTimeString()}
              </p>
            </li>
          ))
        ) : (
          <li className="rounded-lg bg-white px-3 py-2 text-slate-500">Waiting for stream events.</li>
        )}
      </ul>
    </article>
  );
}
