import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import { generateApiKey, hashSecret } from "@/lib/security/crypto";
import type { ApiKeyRecord, AuditLogRecord, MerchantRecord } from "@/lib/store/types";
import type {
  RegisterMerchantInput,
  RevokeApiKeyInput,
  RotateApiKeyInput
} from "@/lib/validations/auth";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ApiKeySummary = {
  id: string;
  label: string | null;
  keyPreview: string;
  status: "active" | "revoked";
  createdAt: string;
  revokedAt: string | null;
  isCurrent: boolean;
};

function isMissingTableError(message: string) {
  return (
    (message.includes("relation") && message.includes("does not exist")) ||
    message.includes("Could not find the table")
  );
}

function keyPreview(prefix: string, last4: string) {
  return `${prefix}...${last4}`;
}

function buildKeyMetadata(apiKey: string) {
  return {
    keyHash: hashSecret(apiKey),
    keyPrefix: apiKey.slice(0, 12),
    keyLast4: apiKey.slice(-4)
  };
}

function fromMerchantRow(row: {
  id: string;
  email: string;
  name: string;
  api_key_hash: string;
  created_at: string;
}): MerchantRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    apiKeyHash: row.api_key_hash,
    createdAt: row.created_at
  };
}

function fromApiKeyRow(row: {
  id: string;
  merchant_id: string;
  key_hash: string;
  key_prefix: string;
  key_last4: string;
  label: string | null;
  status: "active" | "revoked";
  created_at: string;
  revoked_at: string | null;
}): ApiKeyRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    keyHash: row.key_hash,
    keyPrefix: row.key_prefix,
    keyLast4: row.key_last4,
    label: row.label,
    status: row.status,
    createdAt: row.created_at,
    revokedAt: row.revoked_at
  };
}

function fromAuditRow(row: {
  id: string;
  merchant_id: string;
  action: string;
  actor: string;
  metadata: Record<string, string>;
  created_at: string;
}): AuditLogRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    action: row.action,
    actor: row.actor,
    metadata: row.metadata,
    createdAt: row.created_at
  };
}

async function addAuditLog(
  merchantId: string,
  action: string,
  actor: string,
  metadata: Record<string, string>
) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase.from("api_audit_logs").insert({
      id: randomUUID(),
      merchant_id: merchantId,
      action,
      actor,
      metadata
    });

    if (inserted.error && !isMissingTableError(inserted.error.message)) {
      throw new Error(inserted.error.message);
    }
    return;
  }

  const log: AuditLogRecord = {
    id: randomUUID(),
    merchantId,
    action,
    actor,
    metadata,
    createdAt: new Date().toISOString()
  };
  db.auditLogs.set(log.id, log);
}

export async function registerMerchant(input: RegisterMerchantInput) {
  const normalizedEmail = input.email.toLowerCase();
  const apiKey = generateApiKey();
  const key = buildKeyMetadata(apiKey);

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const existing = await supabase
      .from("merchants")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    const existingRow = existing.data as { id: string } | null;
    if (existingRow?.id) {
      throw new Error("merchant_already_exists");
    }

    const merchantId = randomUUID();
    const inserted = await supabase
      .from("merchants")
      .insert({
        id: merchantId,
        email: normalizedEmail,
        name: input.name,
        api_key_hash: key.keyHash
      })
      .select("id, email, name, api_key_hash, created_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    const apiKeyInserted = await supabase.from("merchant_api_keys").insert({
      id: randomUUID(),
      merchant_id: merchantId,
      key_hash: key.keyHash,
      key_prefix: key.keyPrefix,
      key_last4: key.keyLast4,
      label: "primary",
      status: "active",
      revoked_at: null
    });

    if (apiKeyInserted.error && !isMissingTableError(apiKeyInserted.error.message)) {
      throw new Error(apiKeyInserted.error.message);
    }

    await addAuditLog(merchantId, "api_key_created", "merchant_register", {
      keyPreview: keyPreview(key.keyPrefix, key.keyLast4)
    });

    const merchant = fromMerchantRow(
      inserted.data as {
        id: string;
        email: string;
        name: string;
        api_key_hash: string;
        created_at: string;
      }
    );

    return {
      merchant: {
        id: merchant.id,
        email: merchant.email,
        name: merchant.name,
        createdAt: merchant.createdAt
      },
      apiKey
    };
  }

  const existing = Array.from(db.merchants.values()).find(
    (merchant) => merchant.email.toLowerCase() === normalizedEmail
  );

  if (existing) {
    throw new Error("merchant_already_exists");
  }

  const merchant = {
    id: randomUUID(),
    email: normalizedEmail,
    name: input.name,
    apiKeyHash: key.keyHash,
    createdAt: new Date().toISOString()
  };

  db.merchants.set(merchant.id, merchant);
  const apiKeyId = randomUUID();
  db.apiKeys.set(apiKeyId, {
    id: apiKeyId,
    merchantId: merchant.id,
    keyHash: key.keyHash,
    keyPrefix: key.keyPrefix,
    keyLast4: key.keyLast4,
    label: "primary",
    status: "active",
    createdAt: new Date().toISOString(),
    revokedAt: null
  });

  await addAuditLog(merchant.id, "api_key_created", "merchant_register", {
    keyPreview: keyPreview(key.keyPrefix, key.keyLast4)
  });

  return {
    merchant: {
      id: merchant.id,
      email: merchant.email,
      name: merchant.name,
      createdAt: merchant.createdAt
    },
    apiKey
  };
}

export async function getMerchantById(merchantId: string) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const merchant = await supabase
      .from("merchants")
      .select("id, email, name, api_key_hash, created_at")
      .eq("id", merchantId)
      .maybeSingle();

    if (merchant.error) {
      throw new Error(merchant.error.message);
    }

    return merchant.data
      ? fromMerchantRow(
          merchant.data as {
            id: string;
            email: string;
            name: string;
            api_key_hash: string;
            created_at: string;
          }
        )
      : null;
  }

  return db.merchants.get(merchantId) ?? null;
}

export async function authenticateMerchantByApiKey(apiKey: string) {
  const hashed = hashSecret(apiKey);

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const key = await supabase
      .from("merchant_api_keys")
      .select("merchant_id")
      .eq("key_hash", hashed)
      .eq("status", "active")
      .maybeSingle();

    if (key.error && !isMissingTableError(key.error.message)) {
      throw new Error(key.error.message);
    }

    const keyRow = key.data as { merchant_id: string } | null;
    if (keyRow?.merchant_id) {
      return getMerchantById(keyRow.merchant_id);
    }

    // Backward compatibility for merchants created before API key table existed.
    const merchant = await supabase
      .from("merchants")
      .select("id, email, name, api_key_hash, created_at")
      .eq("api_key_hash", hashed)
      .maybeSingle();

    if (merchant.error) {
      throw new Error(merchant.error.message);
    }

    return merchant.data
      ? fromMerchantRow(
          merchant.data as {
            id: string;
            email: string;
            name: string;
            api_key_hash: string;
            created_at: string;
          }
        )
      : null;
  }

  const activeKey = Array.from(db.apiKeys.values()).find(
    (record) => record.keyHash === hashed && record.status === "active"
  );

  if (activeKey) {
    return db.merchants.get(activeKey.merchantId) ?? null;
  }

  return Array.from(db.merchants.values()).find((merchant) => merchant.apiKeyHash === hashed) ?? null;
}

export async function rotateMerchantApiKey(merchant: MerchantRecord, input: RotateApiKeyInput = {}) {
  const nextApiKey = generateApiKey();
  const nextKey = buildKeyMetadata(nextApiKey);
  const now = new Date().toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();

    const inserted = await supabase.from("merchant_api_keys").insert({
      id: randomUUID(),
      merchant_id: merchant.id,
      key_hash: nextKey.keyHash,
      key_prefix: nextKey.keyPrefix,
      key_last4: nextKey.keyLast4,
      label: input.label ?? "rotated",
      status: "active",
      revoked_at: null
    });

    if (inserted.error && !isMissingTableError(inserted.error.message)) {
      throw new Error(inserted.error.message);
    }

    const revoked = await supabase
      .from("merchant_api_keys")
      .update({
        status: "revoked",
        revoked_at: now
      })
      .eq("merchant_id", merchant.id)
      .eq("status", "active")
      .neq("key_hash", nextKey.keyHash);

    if (revoked.error && !isMissingTableError(revoked.error.message)) {
      throw new Error(revoked.error.message);
    }

    const updatedMerchant = await supabase
      .from("merchants")
      .update({ api_key_hash: nextKey.keyHash })
      .eq("id", merchant.id);

    if (updatedMerchant.error) {
      throw new Error(updatedMerchant.error.message);
    }

    await addAuditLog(merchant.id, "api_key_rotated", "merchant", {
      previousKeyHashPrefix: merchant.apiKeyHash.slice(0, 8),
      nextKeyPreview: keyPreview(nextKey.keyPrefix, nextKey.keyLast4),
      reason: input.reason ?? "unspecified"
    });
  } else {
    const activeKeys = Array.from(db.apiKeys.values()).filter(
      (record) => record.merchantId === merchant.id && record.status === "active"
    );

    for (const key of activeKeys) {
      key.status = "revoked";
      key.revokedAt = now;
      db.apiKeys.set(key.id, key);
    }

    const apiKeyRecord: ApiKeyRecord = {
      id: randomUUID(),
      merchantId: merchant.id,
      keyHash: nextKey.keyHash,
      keyPrefix: nextKey.keyPrefix,
      keyLast4: nextKey.keyLast4,
      label: input.label ?? "rotated",
      status: "active",
      createdAt: now,
      revokedAt: null
    };
    db.apiKeys.set(apiKeyRecord.id, apiKeyRecord);

    const merchantRecord = db.merchants.get(merchant.id);
    if (merchantRecord) {
      merchantRecord.apiKeyHash = nextKey.keyHash;
      db.merchants.set(merchant.id, merchantRecord);
    }

    await addAuditLog(merchant.id, "api_key_rotated", "merchant", {
      previousKeyHashPrefix: merchant.apiKeyHash.slice(0, 8),
      nextKeyPreview: keyPreview(nextKey.keyPrefix, nextKey.keyLast4),
      reason: input.reason ?? "unspecified"
    });
  }

  return { apiKey: nextApiKey };
}

export async function revokeMerchantApiKey(
  merchant: MerchantRecord,
  input: RevokeApiKeyInput
) {
  const keyHash = hashSecret(input.apiKey);
  const now = new Date().toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const activeKeys = await supabase
      .from("merchant_api_keys")
      .select("id, merchant_id, key_hash, key_prefix, key_last4, label, status, created_at, revoked_at")
      .eq("merchant_id", merchant.id)
      .eq("status", "active");

    if (activeKeys.error && !isMissingTableError(activeKeys.error.message)) {
      throw new Error(activeKeys.error.message);
    }

    if (activeKeys.error && isMissingTableError(activeKeys.error.message)) {
      throw new AppError(409, "api_key_store_not_configured");
    }

    const active = (activeKeys.data as Array<{
      id: string;
      merchant_id: string;
      key_hash: string;
      key_prefix: string;
      key_last4: string;
      label: string | null;
      status: "active" | "revoked";
      created_at: string;
      revoked_at: string | null;
    }>).map(fromApiKeyRow);

    const target = active.find((record) => record.keyHash === keyHash);
    if (!target) {
      throw new AppError(404, "api_key_not_found");
    }
    if (active.length <= 1) {
      throw new AppError(409, "cannot_revoke_last_active_key");
    }

    const revoked = await supabase
      .from("merchant_api_keys")
      .update({ status: "revoked", revoked_at: now })
      .eq("id", target.id);

    if (revoked.error) {
      throw new Error(revoked.error.message);
    }

    if (merchant.apiKeyHash === keyHash) {
      const replacement = active.find((record) => record.id !== target.id);
      if (replacement) {
        const updatedMerchant = await supabase
          .from("merchants")
          .update({ api_key_hash: replacement.keyHash })
          .eq("id", merchant.id);
        if (updatedMerchant.error) {
          throw new Error(updatedMerchant.error.message);
        }
      }
    }

    await addAuditLog(merchant.id, "api_key_revoked", "merchant", {
      revokedKeyPreview: keyPreview(target.keyPrefix, target.keyLast4),
      reason: input.reason ?? "unspecified"
    });

    return { success: true };
  }

  const active = Array.from(db.apiKeys.values()).filter(
    (record) => record.merchantId === merchant.id && record.status === "active"
  );
  const target = active.find((record) => record.keyHash === keyHash);
  if (!target) {
    throw new AppError(404, "api_key_not_found");
  }
  if (active.length <= 1) {
    throw new AppError(409, "cannot_revoke_last_active_key");
  }

  target.status = "revoked";
  target.revokedAt = now;
  db.apiKeys.set(target.id, target);

  if (merchant.apiKeyHash === keyHash) {
    const replacement = active.find((record) => record.id !== target.id);
    if (replacement) {
      const merchantRecord = db.merchants.get(merchant.id);
      if (merchantRecord) {
        merchantRecord.apiKeyHash = replacement.keyHash;
        db.merchants.set(merchant.id, merchantRecord);
      }
    }
  }

  await addAuditLog(merchant.id, "api_key_revoked", "merchant", {
    revokedKeyPreview: keyPreview(target.keyPrefix, target.keyLast4),
    reason: input.reason ?? "unspecified"
  });

  return { success: true };
}

export async function listMerchantApiKeys(merchant: MerchantRecord): Promise<ApiKeySummary[]> {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const rows = await supabase
      .from("merchant_api_keys")
      .select("id, merchant_id, key_hash, key_prefix, key_last4, label, status, created_at, revoked_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (rows.error && !isMissingTableError(rows.error.message)) {
      throw new Error(rows.error.message);
    }

    if (rows.error && isMissingTableError(rows.error.message)) {
      return [];
    }

    return (rows.data as Array<{
      id: string;
      merchant_id: string;
      key_hash: string;
      key_prefix: string;
      key_last4: string;
      label: string | null;
      status: "active" | "revoked";
      created_at: string;
      revoked_at: string | null;
    }>).map((row) => ({
      id: row.id,
      label: row.label,
      keyPreview: keyPreview(row.key_prefix, row.key_last4),
      status: row.status,
      createdAt: row.created_at,
      revokedAt: row.revoked_at,
      isCurrent: row.key_hash === merchant.apiKeyHash
    }));
  }

  return Array.from(db.apiKeys.values())
    .filter((record) => record.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((record) => ({
      id: record.id,
      label: record.label,
      keyPreview: keyPreview(record.keyPrefix, record.keyLast4),
      status: record.status,
      createdAt: record.createdAt,
      revokedAt: record.revokedAt,
      isCurrent: record.keyHash === merchant.apiKeyHash
    }));
}

export async function listMerchantApiAuditLogs(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const rows = await supabase
      .from("api_audit_logs")
      .select("id, merchant_id, action, actor, metadata, created_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (rows.error && !isMissingTableError(rows.error.message)) {
      throw new Error(rows.error.message);
    }

    if (rows.error && isMissingTableError(rows.error.message)) {
      return [];
    }

    return (rows.data as Array<{
      id: string;
      merchant_id: string;
      action: string;
      actor: string;
      metadata: Record<string, string>;
      created_at: string;
    }>)
      .map(fromAuditRow)
      .slice(0, 100);
  }

  return Array.from(db.auditLogs.values())
    .filter((log) => log.merchantId === merchant.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
