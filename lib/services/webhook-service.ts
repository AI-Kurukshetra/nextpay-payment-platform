import { randomUUID } from "node:crypto";
import { db } from "@/lib/store/database";
import { generateWebhookSecret, signPayload } from "@/lib/security/crypto";
import type {
  MerchantRecord,
  WebhookDeliveryRecord,
  WebhookEndpointRecord,
  WebhookEventRecord
} from "@/lib/store/types";
import type { EmitWebhookEventInput, RegisterWebhookEndpointInput } from "@/lib/validations/webhook";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const MAX_RETRIES = 5;

function fromEndpointRow(row: {
  id: string;
  merchant_id: string;
  url: string;
  secret: string;
  is_active: boolean;
  created_at: string;
}): WebhookEndpointRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    url: row.url,
    secret: row.secret,
    isActive: row.is_active,
    createdAt: row.created_at
  };
}

function fromEventRow(row: {
  id: string;
  merchant_id: string;
  type: string;
  payload: Record<string, unknown>;
  created_at: string;
}): WebhookEventRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    type: row.type,
    payload: row.payload,
    createdAt: row.created_at
  };
}

function fromDeliveryRow(row: {
  id: string;
  event_id: string;
  endpoint_id: string;
  status: "pending" | "delivered" | "failed";
  attempt: number;
  error: string | null;
  next_retry_at: string | null;
  created_at: string;
}): WebhookDeliveryRecord {
  return {
    id: row.id,
    eventId: row.event_id,
    endpointId: row.endpoint_id,
    status: row.status,
    attempt: row.attempt,
    error: row.error,
    nextRetryAt: row.next_retry_at,
    createdAt: row.created_at
  };
}

export async function registerWebhookEndpoint(
  merchant: MerchantRecord,
  input: RegisterWebhookEndpointInput
) {
  const payload = {
    id: randomUUID(),
    merchant_id: merchant.id,
    url: input.url,
    secret: generateWebhookSecret(),
    is_active: true
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("webhook_endpoints")
      .insert(payload)
      .select("id, merchant_id, url, secret, is_active, created_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    return fromEndpointRow(
      inserted.data as {
        id: string;
        merchant_id: string;
        url: string;
        secret: string;
        is_active: boolean;
        created_at: string;
      }
    );
  }

  const endpoint = {
    id: payload.id,
    merchantId: payload.merchant_id,
    url: payload.url,
    secret: payload.secret,
    isActive: payload.is_active,
    createdAt: new Date().toISOString()
  };

  db.webhookEndpoints.set(endpoint.id, endpoint);
  return endpoint;
}

export async function listWebhookEndpoints(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const endpoints = await supabase
      .from("webhook_endpoints")
      .select("id, merchant_id, url, secret, is_active, created_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (endpoints.error) {
      throw new Error(endpoints.error.message);
    }

    return (endpoints.data as Array<{
      id: string;
      merchant_id: string;
      url: string;
      secret: string;
      is_active: boolean;
      created_at: string;
    }>).map(fromEndpointRow);
  }

  return Array.from(db.webhookEndpoints.values()).filter((endpoint) => endpoint.merchantId === merchant.id);
}

export async function emitWebhookEvent(merchant: MerchantRecord, input: EmitWebhookEventInput) {
  const eventPayload = {
    id: randomUUID(),
    merchant_id: merchant.id,
    type: input.type,
    payload: input.payload
  };

  let event: WebhookEventRecord;

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const insertedEvent = await supabase
      .from("webhook_events")
      .insert(eventPayload)
      .select("id, merchant_id, type, payload, created_at")
      .single();

    if (insertedEvent.error) {
      throw new Error(insertedEvent.error.message);
    }

    event = fromEventRow(
      insertedEvent.data as {
        id: string;
        merchant_id: string;
        type: string;
        payload: Record<string, unknown>;
        created_at: string;
      }
    );

    const endpoints = await listWebhookEndpoints(merchant);
    for (const endpoint of endpoints) {
      const deliveryInsert = await supabase.from("webhook_deliveries").insert({
        id: randomUUID(),
        event_id: event.id,
        endpoint_id: endpoint.id,
        status: "pending",
        attempt: 0,
        error: null,
        next_retry_at: new Date().toISOString()
      });

      if (deliveryInsert.error) {
        throw new Error(deliveryInsert.error.message);
      }
    }

    return event;
  }

  event = {
    id: eventPayload.id,
    merchantId: eventPayload.merchant_id,
    type: eventPayload.type,
    payload: eventPayload.payload,
    createdAt: new Date().toISOString()
  };

  db.webhookEvents.set(event.id, event);

  const endpoints = await listWebhookEndpoints(merchant);
  endpoints.forEach((endpoint) => {
    db.webhookDeliveries.set(randomUUID(), {
      id: randomUUID(),
      eventId: event.id,
      endpointId: endpoint.id,
      status: "pending",
      attempt: 0,
      error: null,
      nextRetryAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    });
  });

  return event;
}

export async function processWebhookRetries(now = new Date(), merchantId?: string) {
  let deliveries: WebhookDeliveryRecord[];

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    let endpointIds: string[] | null = null;
    if (merchantId) {
      const endpointRows = await supabase.from("webhook_endpoints").select("id").eq("merchant_id", merchantId);
      if (endpointRows.error) {
        throw new Error(endpointRows.error.message);
      }
      endpointIds = (endpointRows.data as Array<{ id: string }>).map((row) => row.id);
      if (endpointIds.length === 0) {
        return [];
      }
    }

    let pendingQuery = supabase
      .from("webhook_deliveries")
      .select("id, event_id, endpoint_id, status, attempt, error, next_retry_at, created_at")
      .neq("status", "delivered");
    if (endpointIds) {
      pendingQuery = pendingQuery.in("endpoint_id", endpointIds);
    }

    const pending = await pendingQuery;

    if (pending.error) {
      throw new Error(pending.error.message);
    }

    deliveries = (pending.data as Array<{
      id: string;
      event_id: string;
      endpoint_id: string;
      status: "pending" | "delivered" | "failed";
      attempt: number;
      error: string | null;
      next_retry_at: string | null;
      created_at: string;
    }>)
      .map(fromDeliveryRow)
      .filter((delivery) => !delivery.nextRetryAt || new Date(delivery.nextRetryAt) <= now);

    for (const delivery of deliveries) {
      const endpoint = await supabase
        .from("webhook_endpoints")
        .select("id, merchant_id, url, secret, is_active, created_at")
        .eq("id", delivery.endpointId)
        .maybeSingle();
      const event = await supabase
        .from("webhook_events")
        .select("id, merchant_id, type, payload, created_at")
        .eq("id", delivery.eventId)
        .maybeSingle();

      if (endpoint.error || event.error || !endpoint.data || !event.data) {
        await supabase
          .from("webhook_deliveries")
          .update({ status: "failed", error: "missing_dependency" })
          .eq("id", delivery.id);
        continue;
      }

      const endpointRow = endpoint.data as {
        url: string;
        secret: string;
      };
      const eventRow = event.data as {
        payload: Record<string, unknown>;
      };

      const body = JSON.stringify(eventRow.payload);
      const signature = signPayload(endpointRow.secret, body);
      const simulatedSuccess = endpointRow.url.startsWith("https://") && signature.length > 10;

      if (simulatedSuccess) {
        await supabase
          .from("webhook_deliveries")
          .update({ status: "delivered", error: null, next_retry_at: null })
          .eq("id", delivery.id);
      } else {
        const attempt = delivery.attempt + 1;
        await supabase
          .from("webhook_deliveries")
          .update({
            status: "failed",
            attempt,
            error: "delivery_failed",
            next_retry_at: attempt < MAX_RETRIES ? new Date(Date.now() + 2 ** attempt * 60_000).toISOString() : null
          })
          .eq("id", delivery.id);
      }
    }

    const refreshed = await supabase
      .from("webhook_deliveries")
      .select("id, event_id, endpoint_id, status, attempt, error, next_retry_at, created_at")
      .in(
        "id",
        deliveries.map((delivery) => delivery.id)
      );

    if (refreshed.error) {
      throw new Error(refreshed.error.message);
    }

    return (refreshed.data as Array<{
      id: string;
      event_id: string;
      endpoint_id: string;
      status: "pending" | "delivered" | "failed";
      attempt: number;
      error: string | null;
      next_retry_at: string | null;
      created_at: string;
    }>).map(fromDeliveryRow);
  }

  deliveries = Array.from(db.webhookDeliveries.values()).filter((delivery) => {
    if (delivery.status === "delivered" || (delivery.nextRetryAt && new Date(delivery.nextRetryAt) > now)) {
      return false;
    }

    if (!merchantId) {
      return true;
    }

    const endpoint = db.webhookEndpoints.get(delivery.endpointId);
    return endpoint?.merchantId === merchantId;
  });

  for (const delivery of deliveries) {
    const endpoint = db.webhookEndpoints.get(delivery.endpointId);
    const event = db.webhookEvents.get(delivery.eventId);

    if (!endpoint || !event) {
      delivery.status = "failed";
      delivery.error = "missing_dependency";
      db.webhookDeliveries.set(delivery.id, delivery);
      continue;
    }

    const body = JSON.stringify(event.payload);
    const signature = signPayload(endpoint.secret, body);
    const simulatedSuccess = endpoint.url.startsWith("https://") && signature.length > 10;

    if (simulatedSuccess) {
      delivery.status = "delivered";
      delivery.error = null;
      delivery.nextRetryAt = null;
    } else {
      delivery.attempt += 1;
      delivery.status = "failed";
      delivery.error = "delivery_failed";
      if (delivery.attempt < MAX_RETRIES) {
        delivery.nextRetryAt = new Date(Date.now() + 2 ** delivery.attempt * 60_000).toISOString();
      } else {
        delivery.nextRetryAt = null;
      }
    }

    db.webhookDeliveries.set(delivery.id, delivery);
  }

  return deliveries;
}

export async function listWebhookDeliveries(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const endpoints = await supabase
      .from("webhook_endpoints")
      .select("id")
      .eq("merchant_id", merchant.id);

    if (endpoints.error) {
      throw new Error(endpoints.error.message);
    }

    const endpointIds = (endpoints.data as Array<{ id: string }>).map((endpoint: { id: string }) => endpoint.id);

    if (endpointIds.length === 0) {
      return [];
    }

    const deliveries = await supabase
      .from("webhook_deliveries")
      .select("id, event_id, endpoint_id, status, attempt, error, next_retry_at, created_at")
      .in("endpoint_id", endpointIds)
      .order("created_at", { ascending: false });

    if (deliveries.error) {
      throw new Error(deliveries.error.message);
    }

    return (deliveries.data as Array<{
      id: string;
      event_id: string;
      endpoint_id: string;
      status: "pending" | "delivered" | "failed";
      attempt: number;
      error: string | null;
      next_retry_at: string | null;
      created_at: string;
    }>).map(fromDeliveryRow);
  }

  const endpointIds = new Set(
    Array.from(db.webhookEndpoints.values())
      .filter((endpoint) => endpoint.merchantId === merchant.id)
      .map((endpoint) => endpoint.id)
  );

  return Array.from(db.webhookDeliveries.values()).filter((delivery) => endpointIds.has(delivery.endpointId));
}

export async function listWebhookEvents(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const events = await supabase
      .from("webhook_events")
      .select("id, merchant_id, type, payload, created_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (events.error) {
      throw new Error(events.error.message);
    }

    return (events.data as Array<{
      id: string;
      merchant_id: string;
      type: string;
      payload: Record<string, unknown>;
      created_at: string;
    }>).map(fromEventRow);
  }

  return Array.from(db.webhookEvents.values())
    .filter((event) => event.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
