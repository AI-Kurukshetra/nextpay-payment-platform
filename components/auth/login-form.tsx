"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [apiKey, setApiKey] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ apiKey })
      });

      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "login_failed");
        return;
      }

      router.push("/overview");
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="mt-4 space-y-3" onSubmit={onSubmit}>
      <label className="block text-sm text-slate-700" htmlFor="apiKey">
        API Key
      </label>
      <input
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2"
        id="apiKey"
        onChange={(event) => setApiKey(event.target.value)}
        placeholder="np_live_..."
        required
        value={apiKey}
      />
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <button
        className="w-full rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
        disabled={isLoading}
        type="submit"
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
