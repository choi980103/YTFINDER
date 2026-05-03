import { getSupabaseAdmin } from "@/lib/supabase";

const ENV_CODES = new Set(
  (process.env.ACCESS_CODES || "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
);

export type CodeCheckResult =
  | { valid: true; source: "db" | "env" }
  | { valid: false; reason: "unknown" | "revoked" | "expired" };

/**
 * 액세스 코드 유효성 검증.
 * 1) Supabase DB 조회 (status=active, 만료되지 않음)
 * 2) DB에 없거나 Supabase 미설정 시 ENV의 ACCESS_CODES로 fallback
 *    (마이그레이션 누락 시에도 서비스 중단 방지)
 */
export async function checkAccessCode(rawCode: string): Promise<CodeCheckResult> {
  const code = rawCode.trim().toUpperCase();
  const admin = getSupabaseAdmin();

  if (admin) {
    const { data, error } = await admin
      .from("access_codes")
      .select("status, expires_at")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      console.error("[accessCodes] DB lookup failed", error.message);
    } else if (data) {
      if (data.status === "revoked") return { valid: false, reason: "revoked" };
      if (data.status === "expired") return { valid: false, reason: "expired" };
      if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
        return { valid: false, reason: "expired" };
      }
      return { valid: true, source: "db" };
    }
  }

  if (ENV_CODES.has(code)) return { valid: true, source: "env" };
  return { valid: false, reason: "unknown" };
}
