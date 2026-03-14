import { createBrowserClient } from "@supabase/ssr";
import { getBrowserSupabaseConfig } from "@/lib/supabase/config";

export function getSupabaseBrowserClient() {
  const { url, anonKey } = getBrowserSupabaseConfig();
  return createBrowserClient(url, anonKey);
}
