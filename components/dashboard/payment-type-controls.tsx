"use client";

import { useEffect, useState } from "react";
import { toReadableErrorMessage } from "@/lib/ui/error-message";

type PaymentTypeSettings = {
  allowCard: boolean;
  allowBank: boolean;
  allowCrypto: boolean;
};

export function PaymentTypeControls() {
  const [settings, setSettings] = useState<PaymentTypeSettings>({
    allowCard: true,
    allowBank: true,
    allowCrypto: true
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const response = await fetch("/api/v1/dashboard/payment-preferences");
        const payload = await response.json();
        if (!response.ok) {
          if (mounted) {
            setError(toReadableErrorMessage(payload.error));
          }
          return;
        }
        if (mounted) {
          setSettings({
            allowCard: Boolean(payload.allowCard),
            allowBank: Boolean(payload.allowBank),
            allowCrypto: Boolean(payload.allowCrypto)
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  async function save(next: PaymentTypeSettings) {
    setIsSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/v1/dashboard/payment-preferences", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next)
      });
      const payload = await response.json();
      if (!response.ok) {
        setError(toReadableErrorMessage(payload.error));
        return;
      }
      setSettings({
        allowCard: Boolean(payload.allowCard),
        allowBank: Boolean(payload.allowBank),
        allowCrypto: Boolean(payload.allowCrypto)
      });
      setMessage("Payment type settings updated.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggle(key: keyof PaymentTypeSettings) {
    const next = {
      ...settings,
      [key]: !settings[key]
    };
    if (!next.allowCard && !next.allowBank && !next.allowCrypto) {
      setError("At least one payment type must stay enabled.");
      return;
    }
    void save(next);
  }

  return (
    <article className="glass rounded-2xl p-5">
      <h3 className="text-lg font-semibold">Allowed Payment Types</h3>
      <p className="mt-1 text-sm text-slate-600">
        Control which payment types your end users can use during checkout.
      </p>

      {isLoading ? (
        <p className="mt-3 text-sm text-slate-500">Loading settings...</p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          <button
            className={`rounded-xl border px-3 py-2 text-sm font-medium ${
              settings.allowCard ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"
            }`}
            disabled={isSaving}
            onClick={() => toggle("allowCard")}
            type="button"
          >
            Card: {settings.allowCard ? "Enabled" : "Disabled"}
          </button>
          <button
            className={`rounded-xl border px-3 py-2 text-sm font-medium ${
              settings.allowBank ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"
            }`}
            disabled={isSaving}
            onClick={() => toggle("allowBank")}
            type="button"
          >
            Bank: {settings.allowBank ? "Enabled" : "Disabled"}
          </button>
          <button
            className={`rounded-xl border px-3 py-2 text-sm font-medium ${
              settings.allowCrypto ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"
            }`}
            disabled={isSaving}
            onClick={() => toggle("allowCrypto")}
            type="button"
          >
            Crypto: {settings.allowCrypto ? "Enabled" : "Disabled"}
          </button>
        </div>
      )}

      {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}
      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </article>
  );
}
