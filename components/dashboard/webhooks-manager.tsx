"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { WebhookDeliveryRecord, WebhookEndpointRecord, WebhookEventRecord } from "@/lib/store/types";
import { toReadableErrorMessage } from "@/lib/ui/error-message";

type WebhooksManagerProps = {
  endpoints: WebhookEndpointRecord[];
  deliveries: WebhookDeliveryRecord[];
  events: WebhookEventRecord[];
};

async function readJsonSafe(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function WebhooksManager({ endpoints, deliveries, events }: WebhooksManagerProps) {
  const router = useRouter();
  const [createUrl, setCreateUrl] = useState("");
  const [testEventType, setTestEventType] = useState("payment.succeeded");
  const [testPayload, setTestPayload] = useState('{"source":"dashboard_test"}');
  const [editing, setEditing] = useState<Record<string, { url: string; isActive: boolean }>>(
    Object.fromEntries(endpoints.map((endpoint) => [endpoint.id, { url: endpoint.url, isActive: endpoint.isActive }]))
  );
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");

  const eventMap = useMemo(() => new Map(events.map((event) => [event.id, event.type])), [events]);
  const endpointMap = useMemo(() => new Map(endpoints.map((endpoint) => [endpoint.id, endpoint.url])), [endpoints]);

  async function perform(actionKey: string, action: () => Promise<void>) {
    setError("");
    setMessage("");
    setLoadingAction(actionKey);
    try {
      await action();
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="text-xl font-semibold">Webhooks</h2>
      <p className="mt-1 text-sm text-slate-600">Manage endpoints, run test events, and track delivery retries.</p>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold">Create Endpoint</h3>
        <div className="mt-3 flex flex-col gap-2 md:flex-row">
          <input
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setCreateUrl(event.target.value)}
            placeholder="https://merchant.example.com/webhooks"
            type="url"
            value={createUrl}
          />
          <button
            className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
            disabled={loadingAction === "create"}
            onClick={() =>
              perform("create", async () => {
                const response = await fetch("/api/v1/dashboard/webhooks/endpoints", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ url: createUrl })
                });
                const result = await readJsonSafe(response);
                if (!response.ok) {
                  setError(toReadableErrorMessage(result?.error ?? "validation_error"));
                  return;
                }
                setMessage("Webhook endpoint created.");
                setCreateUrl("");
              })
            }
            type="button"
          >
            {loadingAction === "create" ? "Creating..." : "Create"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-semibold">Send Test Event</h3>
        <div className="mt-3 grid gap-2 md:grid-cols-[220px_1fr_auto]">
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setTestEventType(event.target.value)}
            value={testEventType}
          />
          <input
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
            onChange={(event) => setTestPayload(event.target.value)}
            value={testPayload}
          />
          <button
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            disabled={loadingAction === "test"}
            onClick={() =>
              perform("test", async () => {
                let parsedPayload: Record<string, unknown>;
                try {
                  parsedPayload = JSON.parse(testPayload) as Record<string, unknown>;
                } catch {
                  setError("Test payload must be valid JSON.");
                  return;
                }

                const response = await fetch("/api/v1/dashboard/webhooks/events", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    type: testEventType,
                    payload: parsedPayload
                  })
                });
                const result = await readJsonSafe(response);
                if (!response.ok) {
                  setError(toReadableErrorMessage(result?.error));
                  return;
                }
                setMessage("Test event queued for delivery.");
              })
            }
            type="button"
          >
            {loadingAction === "test" ? "Sending..." : "Send Event"}
          </button>
        </div>
      </div>

      {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="mt-3 text-sm text-teal-700">{message}</p> : null}

      <div className="mt-4 space-y-3">
        <h3 className="text-sm font-semibold">Endpoints</h3>
        {endpoints.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500">No endpoints yet.</div>
        ) : (
          endpoints.map((endpoint) => {
            const draft = editing[endpoint.id] ?? { url: endpoint.url, isActive: endpoint.isActive };
            return (
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-3" key={endpoint.id}>
                <div className="grid gap-2 md:grid-cols-[1fr_auto_auto_auto] md:items-center">
                  <input
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm"
                    onChange={(event) =>
                      setEditing((prev) => ({
                        ...prev,
                        [endpoint.id]: { ...draft, url: event.target.value }
                      }))
                    }
                    type="url"
                    value={draft.url}
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      checked={draft.isActive}
                      onChange={(event) =>
                        setEditing((prev) => ({
                          ...prev,
                          [endpoint.id]: { ...draft, isActive: event.target.checked }
                        }))
                      }
                      type="checkbox"
                    />
                    Active
                  </label>
                  <button
                    className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    disabled={loadingAction === `verify-${endpoint.id}`}
                    onClick={() =>
                      perform(`verify-${endpoint.id}`, async () => {
                        const response = await fetch(`/api/v1/dashboard/webhooks/endpoints/${endpoint.id}/verify`, {
                          method: "POST"
                        });
                        const result = await readJsonSafe(response);
                        if (!response.ok) {
                          setError(toReadableErrorMessage(result?.error));
                          return;
                        }
                        setMessage("Endpoint verified.");
                      })
                    }
                    type="button"
                  >
                    Verify
                  </button>
                  <button
                    className="rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700 hover:bg-rose-100 disabled:opacity-60"
                    disabled={loadingAction === `delete-${endpoint.id}`}
                    onClick={() =>
                      perform(`delete-${endpoint.id}`, async () => {
                        const response = await fetch(`/api/v1/dashboard/webhooks/endpoints/${endpoint.id}`, {
                          method: "DELETE"
                        });
                        const result = await readJsonSafe(response);
                        if (!response.ok) {
                          setError(toReadableErrorMessage(result?.error));
                          return;
                        }
                        setMessage("Endpoint deleted.");
                      })
                    }
                    type="button"
                  >
                    Delete
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    className="rounded-xl bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
                    disabled={loadingAction === `save-${endpoint.id}`}
                    onClick={() =>
                      perform(`save-${endpoint.id}`, async () => {
                        const response = await fetch(`/api/v1/dashboard/webhooks/endpoints/${endpoint.id}`, {
                          method: "PATCH",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            url: draft.url,
                            isActive: draft.isActive
                          })
                        });
                        const result = await readJsonSafe(response);
                        if (!response.ok) {
                          setError(toReadableErrorMessage(result?.error));
                          return;
                        }
                        setMessage("Endpoint updated.");
                      })
                    }
                    type="button"
                  >
                    Save Changes
                  </button>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                    {endpoint.verifiedAt ? `Verified ${new Date(endpoint.verifiedAt).toLocaleString()}` : "Not verified"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">Secret: {endpoint.secret.slice(0, 10)}...</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold">Recent Deliveries</h3>
        {deliveries.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500">No deliveries yet.</div>
        ) : (
          deliveries.slice(0, 12).map((delivery) => (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3" key={delivery.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{eventMap.get(delivery.eventId) ?? delivery.eventId}</p>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">{delivery.status}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600">{endpointMap.get(delivery.endpointId) ?? delivery.endpointId}</p>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 space-y-2">
        <h3 className="text-sm font-semibold">Recent Events</h3>
        {events.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500">No events yet.</div>
        ) : (
          events.slice(0, 10).map((event) => (
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3" key={event.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{event.type}</p>
                <span className="text-xs text-slate-500">{new Date(event.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
