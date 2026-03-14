import { createClient } from "@supabase/supabase-js";
import type { SupabaseAdminClient } from "@/lib/supabase/types";

let adminClient: SupabaseAdminClient | null = null;

export function isSupabaseConfigured() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getSupabaseAdminClient(): SupabaseAdminClient {
  if (!isSupabaseConfigured()) {
    throw new Error("supabase_not_configured");
  }

  if (!adminClient) {
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
    adminClient = client as unknown as SupabaseAdminClient;
  }

  return adminClient;
}
