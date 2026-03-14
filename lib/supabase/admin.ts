import { createClient } from "@supabase/supabase-js";
import type { SupabaseAdminClient } from "@/lib/supabase/types";
import { getServerSupabaseConfig } from "@/lib/supabase/config";

let adminClient: SupabaseAdminClient | null = null;

export function isSupabaseConfigured() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL);
  const hasAnon = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY);
  return Boolean(hasUrl && hasAnon && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabaseAdminClient(): SupabaseAdminClient {
  if (!isSupabaseConfigured()) {
    throw new Error("supabase_not_configured");
  }

  if (!adminClient) {
    const { url } = getServerSupabaseConfig();
    const client = createClient(
      url,
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
