"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toReadableErrorMessage } from "@/lib/ui/error-message";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createdApiKey, setCreatedApiKey] = useState("");
  const [isKeyPopupOpen, setIsKeyPopupOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsCopied(false);
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(toReadableErrorMessage(result.error ?? "register_failed"));
        return;
      }

      setCreatedApiKey(result.apiKey ?? "");
      setIsKeyPopupOpen(true);
    } finally {
      setIsLoading(false);
    }
  }

  async function onCopyApiKey() {
    if (!createdApiKey) return;
    try {
      await navigator.clipboard.writeText(createdApiKey);
      setIsCopied(true);
    } catch {
      setError(toReadableErrorMessage("copy_failed"));
    }
  }

  function onContinueToDashboard() {
    setIsKeyPopupOpen(false);
    router.push("/overview");
    router.refresh();
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
      <label className="block text-sm text-slate-700" htmlFor="name">
        Merchant Name
      </label>
      <input
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
        id="name"
        onChange={(event) => setName(event.target.value)}
        placeholder="Acme Inc"
        required
        value={name}
      />

      <label className="block text-sm text-slate-700" htmlFor="email">
        Email
      </label>
      <input
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
        id="email"
        onChange={(event) => setEmail(event.target.value)}
        placeholder="merchant@example.com"
        required
        type="email"
        value={email}
      />

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      <button
        className="w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Creating..." : "Create Account"}
      </button>

      {createdApiKey ? (
        <p className="rounded-xl bg-slate-900 px-3 py-2 text-xs text-cyan-100">
          API key (store securely): {createdApiKey}
        </p>
      ) : null}

      {isKeyPopupOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Copy Your API Key</h2>
            <p className="mt-1 text-sm text-slate-600">
              This key is shown once here. Copy and store it securely before continuing.
            </p>

            <div className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-xs text-cyan-100 break-all">
              {createdApiKey}
            </div>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                onClick={onCopyApiKey}
                type="button"
              >
                {isCopied ? "Copied" : "Copy API Key"}
              </button>
              <button
                className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
                onClick={onContinueToDashboard}
                type="button"
              >
                OK, Continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
