import { isSupabaseConfigured } from "@/lib/supabase/admin";

export function shouldUseSupabase() {
  return process.env.NEXTPAY_PERSISTENCE === "supabase" && isSupabaseConfigured();
}
