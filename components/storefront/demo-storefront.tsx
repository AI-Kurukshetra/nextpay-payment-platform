"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import type { StorefrontProduct } from "@/lib/storefront/catalog";
import { toReadableErrorMessage } from "@/lib/ui/error-message";

type DemoStorefrontProps = {
  products: StorefrontProduct[];
};

type Processor = "stripe" | "adyen" | "razorpay" | "bank_gateway" | "crypto_processor";
type RouteType = "card" | "bank" | "crypto";

function amountLabel(amount: number, currency: string) {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}

function routeOptions(routeType: RouteType): Array<{ value: Processor; label: string }> {
  if (routeType === "bank") {
    return [{ value: "bank_gateway", label: "Bank Gateway" }];
  }
  if (routeType === "crypto") {
    return [{ value: "crypto_processor", label: "Crypto Processor" }];
  }
  return [
    { value: "stripe", label: "Stripe" },
    { value: "adyen", label: "Adyen" },
    { value: "razorpay", label: "Razorpay" }
  ];
}

export function DemoStorefront({ products }: DemoStorefrontProps) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [buyerName, setBuyerName] = useState("Demo Buyer");
  const [buyerEmail, setBuyerEmail] = useState("buyer@example.com");
  const [routingMode, setRoutingMode] = useState<"auto" | "manual">("auto");
  const [routeType, setRouteType] = useState<RouteType>("card");
  const [preferredProcessor, setPreferredProcessor] = useState<Processor>("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState("");

  const selectedProduct = useMemo(
    () => products.find((item) => item.id === selectedProductId) ?? products[0],
    [products, selectedProductId]
  );

  const totalMinor = (selectedProduct?.amount ?? 0) * quantity;
  const totalLabel = selectedProduct ? amountLabel(totalMinor, selectedProduct.currency) : "USD 0.00";

  async function checkout() {
    if (!selectedProduct) {
      return;
    }

    setIsSubmitting(true);
    setResult("");
    try {
      const response = await fetch("/api/v1/dashboard/storefront/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: selectedProduct.id,
          quantity,
          buyerName,
          buyerEmail,
          routingMode,
          routeType,
          preferredProcessor: routingMode === "manual" ? preferredProcessor : undefined
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        setResult(`Error: ${toReadableErrorMessage(payload.error)}`);
        return;
      }
      setResult(
        `Payment ${payload.paymentId} created: ${payload.status} via ${String(payload.processor).toUpperCase()}`
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <header className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-2xl font-semibold">Storefront Demo</h2>
        <p className="mt-1 text-sm text-slate-600">
          Simulate a buyer-facing web app using PayForge as the payment gateway.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-2">
          {products.map((item) => {
            const selected = selectedProductId === item.id;
            return (
              <article
                className={
                  selected
                    ? "overflow-hidden rounded-2xl border-2 border-teal-500 bg-white shadow-sm"
                    : "overflow-hidden rounded-2xl border border-slate-200 bg-white"
                }
                key={item.id}
              >
                <Image
                  alt={item.name}
                  className="h-36 w-full object-cover"
                  height={220}
                  src={item.image}
                  unoptimized
                  width={400}
                />
                <div className="p-3">
                  <h3 className="font-semibold">{item.name}</h3>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                  <p className="mt-2 text-sm font-medium text-slate-800">{amountLabel(item.amount, item.currency)}</p>
                  <button
                    className={
                      selected
                        ? "mt-3 w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white"
                        : "mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                    }
                    onClick={() => setSelectedProductId(item.id)}
                    type="button"
                  >
                    {selected ? "Selected" : "Choose"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold">Checkout</h3>
          <p className="mt-1 text-sm text-slate-600">Collect buyer details and create a payment intent.</p>

          <div className="mt-3 grid gap-2">
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Buyer Name</span>
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                onChange={(event) => setBuyerName(event.target.value)}
                value={buyerName}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Buyer Email</span>
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                onChange={(event) => setBuyerEmail(event.target.value)}
                type="email"
                value={buyerEmail}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Quantity</span>
              <input
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                max={20}
                min={1}
                onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                type="number"
                value={quantity}
              />
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-slate-600">Routing Mode</span>
              <select
                className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                onChange={(event) => setRoutingMode(event.target.value as "auto" | "manual")}
                value={routingMode}
              >
                <option value="auto">Auto</option>
                <option value="manual">Manual</option>
              </select>
            </label>

            {routingMode === "manual" ? (
              <>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-600">Route Type</span>
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                    onChange={(event) => {
                      const next = event.target.value as RouteType;
                      setRouteType(next);
                      setPreferredProcessor(routeOptions(next)[0].value);
                    }}
                    value={routeType}
                  >
                    <option value="card">Card</option>
                    <option value="bank">Bank</option>
                    <option value="crypto">Crypto</option>
                  </select>
                </label>
                <label className="grid gap-1 text-sm">
                  <span className="text-slate-600">Processor</span>
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2"
                    onChange={(event) => setPreferredProcessor(event.target.value as Processor)}
                    value={preferredProcessor}
                  >
                    {routeOptions(routeType).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            ) : null}
          </div>

          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              Total: <span className="font-semibold">{totalLabel}</span>
            </p>
          </div>

          <button
            className="mt-3 w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            disabled={isSubmitting || !selectedProduct}
            onClick={checkout}
            type="button"
          >
            {isSubmitting ? "Processing..." : `Pay ${totalLabel}`}
          </button>

          {result ? <p className="mt-3 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-700">{result}</p> : null}
        </aside>
      </div>
    </section>
  );
}
