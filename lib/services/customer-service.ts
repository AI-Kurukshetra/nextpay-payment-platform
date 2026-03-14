import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { CustomerRecord, MerchantRecord } from "@/lib/store/types";
import type { CreateCustomerInput } from "@/lib/validations/customer";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

function fromCustomerRow(row: {
  id: string;
  merchant_id: string;
  email: string;
  name: string;
  created_at: string;
}): CustomerRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at
  };
}

export async function createCustomer(merchant: MerchantRecord, input: CreateCustomerInput) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("customers")
      .insert({
        id: randomUUID(),
        merchant_id: merchant.id,
        email: input.email.toLowerCase(),
        name: input.name
      })
      .select("id, merchant_id, email, name, created_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    return fromCustomerRow(
      inserted.data as {
        id: string;
        merchant_id: string;
        email: string;
        name: string;
        created_at: string;
      }
    );
  }

  const customer = {
    id: randomUUID(),
    merchantId: merchant.id,
    email: input.email.toLowerCase(),
    name: input.name,
    createdAt: new Date().toISOString()
  };

  db.customers.set(customer.id, customer);
  return customer;
}

export async function getCustomerById(merchant: MerchantRecord, customerId: string) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const customer = await supabase
      .from("customers")
      .select("id, merchant_id, email, name, created_at")
      .eq("merchant_id", merchant.id)
      .eq("id", customerId)
      .maybeSingle();

    if (customer.error) {
      throw new Error(customer.error.message);
    }

    if (!customer.data) {
      throw new AppError(404, "customer_not_found");
    }

    return fromCustomerRow(
      customer.data as {
        id: string;
        merchant_id: string;
        email: string;
        name: string;
        created_at: string;
      }
    );
  }

  const customer = db.customers.get(customerId);

  if (!customer || customer.merchantId !== merchant.id) {
    throw new AppError(404, "customer_not_found");
  }

  return customer;
}

export async function listCustomers(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const customers = await supabase
      .from("customers")
      .select("id, merchant_id, email, name, created_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (customers.error) {
      throw new Error(customers.error.message);
    }

    return (customers.data as Array<{
      id: string;
      merchant_id: string;
      email: string;
      name: string;
      created_at: string;
    }>).map(fromCustomerRow);
  }

  return Array.from(db.customers.values()).filter((customer) => customer.merchantId === merchant.id);
}
