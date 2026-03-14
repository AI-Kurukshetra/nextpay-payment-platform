import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, NotificationRecord } from "@/lib/store/types";
import type { CreateNotificationInput, UpdateNotificationInput } from "@/lib/validations/notification";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function fromRow(row: {
  id: string;
  merchant_id: string;
  channel: NotificationRecord["channel"];
  title: string;
  message: string;
  status: NotificationRecord["status"];
  created_at: string;
  read_at: string | null;
}): NotificationRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    channel: row.channel,
    title: row.title,
    message: row.message,
    status: row.status,
    createdAt: row.created_at,
    readAt: row.read_at
  };
}

export async function createNotification(merchant: MerchantRecord, input: CreateNotificationInput) {
  const payload = {
    id: randomUUID(),
    merchant_id: merchant.id,
    channel: input.channel,
    title: input.title,
    message: input.message,
    status: "unread" as const,
    read_at: null as string | null
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("notifications")
      .insert(payload)
      .select("id, merchant_id, channel, title, message, status, created_at, read_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    return fromRow(
      inserted.data as {
        id: string;
        merchant_id: string;
        channel: NotificationRecord["channel"];
        title: string;
        message: string;
        status: NotificationRecord["status"];
        created_at: string;
        read_at: string | null;
      }
    );
  }

  const notification: NotificationRecord = {
    id: payload.id,
    merchantId: payload.merchant_id,
    channel: payload.channel,
    title: payload.title,
    message: payload.message,
    status: payload.status,
    createdAt: new Date().toISOString(),
    readAt: null
  };
  db.notifications.set(notification.id, notification);
  return notification;
}

export async function listNotifications(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const result = await supabase
      .from("notifications")
      .select("id, merchant_id, channel, title, message, status, created_at, read_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return (result.data as Array<{
      id: string;
      merchant_id: string;
      channel: NotificationRecord["channel"];
      title: string;
      message: string;
      status: NotificationRecord["status"];
      created_at: string;
      read_at: string | null;
    }>).map(fromRow);
  }

  return Array.from(db.notifications.values())
    .filter((notification) => notification.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function updateNotification(
  merchant: MerchantRecord,
  notificationId: string,
  input: UpdateNotificationInput
) {
  const readAt = input.status === "read" ? new Date().toISOString() : null;

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updated = await supabase
      .from("notifications")
      .update({
        status: input.status,
        read_at: readAt
      })
      .eq("merchant_id", merchant.id)
      .eq("id", notificationId)
      .select("id, merchant_id, channel, title, message, status, created_at, read_at")
      .maybeSingle();

    if (updated.error) {
      throw new Error(updated.error.message);
    }
    if (!updated.data) {
      throw new AppError(404, "notification_not_found");
    }

    return fromRow(
      updated.data as {
        id: string;
        merchant_id: string;
        channel: NotificationRecord["channel"];
        title: string;
        message: string;
        status: NotificationRecord["status"];
        created_at: string;
        read_at: string | null;
      }
    );
  }

  const current = db.notifications.get(notificationId);
  if (!current || current.merchantId !== merchant.id) {
    throw new AppError(404, "notification_not_found");
  }

  const next: NotificationRecord = {
    ...current,
    status: input.status,
    readAt
  };
  db.notifications.set(notificationId, next);
  return next;
}
