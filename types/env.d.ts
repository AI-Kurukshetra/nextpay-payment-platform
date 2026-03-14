declare namespace NodeJS {
  interface ProcessEnv {
    NEXTPAY_PERSISTENCE?: "memory" | "supabase";
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_URL?: string;
    SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    NEXTPAY_SESSION_SECRET?: string;
    NEXTPAY_WORKER_SECRET?: string;
    NEXTPAY_BASE_URL?: string;
    NEXTPAY_WORKER_INTERVAL_MS?: string;
    NEXTPAY_ASR_PROVIDER_URL?: string;
    NEXTPAY_ASR_PROVIDER_KEY?: string;
    NEXTPAY_NLU_PROVIDER_URL?: string;
    NEXTPAY_NLU_PROVIDER_KEY?: string;
    POSTGRES_HOST?: string;
    POSTGRES_PORT?: string;
    POSTGRES_DB?: string;
    POSTGRES_USER?: string;
    POSTGRES_PASSWORD?: string;
    DATABASE_URL?: string;
  }
}
