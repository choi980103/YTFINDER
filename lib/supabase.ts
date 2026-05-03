import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

let browserSingleton: SupabaseClient | null = null;
let adminSingleton: SupabaseClient | null = null;

export function getSupabaseBrowser(): SupabaseClient | null {
  if (!SUPABASE_URL || !PUBLISHABLE_KEY) return null;
  if (!browserSingleton) {
    browserSingleton = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
      auth: { persistSession: false },
    });
  }
  return browserSingleton;
}

export function getSupabaseAdmin(): SupabaseClient | null {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseAdmin은 서버에서만 호출할 수 있습니다.");
  }
  if (!SUPABASE_URL || !SECRET_KEY) return null;
  if (!adminSingleton) {
    adminSingleton = createClient(SUPABASE_URL, SECRET_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return adminSingleton;
}

export type AccessCodeRow = {
  code: string;
  status: "active" | "revoked" | "expired";
  plan: "free_trial" | "early" | "1m" | "3m" | "6m" | "12m" | "lifetime";
  customer_email: string | null;
  customer_nickname: string | null;
  issued_at: string;
  expires_at: string | null;
  note: string | null;
};

export type OrderRow = {
  id: string;
  customer_email: string | null;
  customer_nickname: string | null;
  channel: "kmong" | "paymentteacher" | "toss" | "manual";
  amount: number;
  plan: AccessCodeRow["plan"];
  access_code: string | null;
  paid_at: string;
  note: string | null;
};
