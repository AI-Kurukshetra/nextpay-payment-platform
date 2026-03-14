"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RegisterForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [createdApiKey, setCreatedApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "register_failed");
        return;
      }

      setCreatedApiKey(result.apiKey ?? "");
      router.push("/overview");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
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
    </form>
  );
}
