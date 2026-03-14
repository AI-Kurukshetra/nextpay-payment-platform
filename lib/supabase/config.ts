function readServerEnv(name: "url" | "anonKey") {
  if (name === "url") {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  }
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
}

export function getServerSupabaseConfig() {
  const url = readServerEnv("url");
  const anonKey = readServerEnv("anonKey");

  if (!url || !anonKey) {
    throw new Error(
      "supabase_env_missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_URL and SUPABASE_ANON_KEY)"
    );
  }

  return { url, anonKey };
}

export function getBrowserSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "supabase_public_env_missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }

  return { url, anonKey };
}
