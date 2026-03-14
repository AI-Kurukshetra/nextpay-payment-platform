import { db } from "@/lib/store/database";
import type { MerchantPaymentPreferencesRecord, MerchantRecord } from "@/lib/store/types";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { UpdatePaymentPreferencesInput } from "@/lib/validations/payment-preferences";

const DEFAULT_PREFERENCES: Omit<MerchantPaymentPreferencesRecord, "merchantId" | "createdAt" | "updatedAt"> = {
  allowCard: true,
  allowBank: true,
  allowCrypto: true
};

function fromRow(row: {
  merchant_id: string;
  allow_card: boolean;
  allow_bank: boolean;
  allow_crypto: boolean;
  created_at: string;
  updated_at: string;
}): MerchantPaymentPreferencesRecord {
  return {
    merchantId: row.merchant_id,
    allowCard: row.allow_card,
    allowBank: row.allow_bank,
    allowCrypto: row.allow_crypto,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getMerchantPaymentPreferences(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const result = await supabase
      .from("merchant_payment_preferences")
      .select("merchant_id, allow_card, allow_bank, allow_crypto, created_at, updated_at")
      .eq("merchant_id", merchant.id)
      .maybeSingle();

    if (result.error) {
      throw new Error(result.error.message);
    }

    if (!result.data) {
      const now = new Date().toISOString();
      const inserted = await supabase
        .from("merchant_payment_preferences")
        .insert({
          merchant_id: merchant.id,
          allow_card: true,
          allow_bank: true,
          allow_crypto: true,
          created_at: now,
          updated_at: now
        })
        .select("merchant_id, allow_card, allow_bank, allow_crypto, created_at, updated_at")
        .single();

      if (inserted.error) {
        throw new Error(inserted.error.message);
      }

      return fromRow(
        inserted.data as {
          merchant_id: string;
          allow_card: boolean;
          allow_bank: boolean;
          allow_crypto: boolean;
          created_at: string;
          updated_at: string;
        }
      );
    }

    return fromRow(
      result.data as {
        merchant_id: string;
        allow_card: boolean;
        allow_bank: boolean;
        allow_crypto: boolean;
        created_at: string;
        updated_at: string;
      }
    );
  }

  const existing = db.merchantPaymentPreferences.get(merchant.id);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const created: MerchantPaymentPreferencesRecord = {
    merchantId: merchant.id,
    ...DEFAULT_PREFERENCES,
    createdAt: now,
    updatedAt: now
  };
  db.merchantPaymentPreferences.set(merchant.id, created);
  return created;
}

export async function updateMerchantPaymentPreferences(
  merchant: MerchantRecord,
  input: UpdatePaymentPreferencesInput
) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updatedAt = new Date().toISOString();
    const upserted = await supabase
      .from("merchant_payment_preferences")
      .upsert({
        merchant_id: merchant.id,
        allow_card: input.allowCard,
        allow_bank: input.allowBank,
        allow_crypto: input.allowCrypto,
        updated_at: updatedAt
      })
      .select("merchant_id, allow_card, allow_bank, allow_crypto, created_at, updated_at")
      .single();

    if (upserted.error) {
      throw new Error(upserted.error.message);
    }

    return fromRow(
      upserted.data as {
        merchant_id: string;
        allow_card: boolean;
        allow_bank: boolean;
        allow_crypto: boolean;
        created_at: string;
        updated_at: string;
      }
    );
  }

  const now = new Date().toISOString();
  const current = db.merchantPaymentPreferences.get(merchant.id);
  const next: MerchantPaymentPreferencesRecord = {
    merchantId: merchant.id,
    allowCard: input.allowCard,
    allowBank: input.allowBank,
    allowCrypto: input.allowCrypto,
    createdAt: current?.createdAt ?? now,
    updatedAt: now
  };
  db.merchantPaymentPreferences.set(merchant.id, next);
  return next;
}
