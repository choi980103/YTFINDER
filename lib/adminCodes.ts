import { getSupabaseAdmin } from "@/lib/supabase";

export type Plan = "free_trial" | "1m" | "3m" | "6m" | "12m" | "lifetime";
export type Channel = "kmong" | "paymentteacher" | "toss" | "manual";

const PLAN_PREFIX: Record<Plan, string> = {
  free_trial: "FREE",
  "1m": "1M",
  "3m": "3M",
  "6m": "6M",
  "12m": "12M",
  lifetime: "LT",
};

const PLAN_MONTHS: Record<Plan, number | null> = {
  free_trial: 0,
  "1m": 1,
  "3m": 3,
  "6m": 6,
  "12m": 12,
  lifetime: null, // 영구
};

// 헷갈리기 쉬운 0/O, 1/I/L 제외한 영숫자
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomSegment(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) {
    s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return s;
}

/**
 * 액세스 코드 생성 + DB 충돌 회피.
 * 패턴: YTFINDER-{1M|3M|6M|12M|LT|FREE}-{8자 랜덤}
 * 충돌 시 최대 5회 재시도.
 */
export async function generateUniqueCode(plan: Plan): Promise<string> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin client not configured");

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `YTFINDER-${PLAN_PREFIX[plan]}-${randomSegment(8)}`;
    const { data, error } = await admin
      .from("access_codes")
      .select("code")
      .eq("code", code)
      .maybeSingle();
    if (error) {
      const msg = error.message || "알 수 없는 DB 오류";
      const details = error.details ? ` (${error.details})` : "";
      const hint = error.hint ? ` [hint: ${error.hint}]` : "";
      throw new Error(`Supabase 조회 실패: ${msg}${details}${hint}`);
    }
    if (!data) return code;
  }
  throw new Error("코드 생성 충돌 5회 — 다시 시도해주세요");
}

/**
 * 결제일 + 플랜 → 만료일 (lifetime/free_trial은 null/없음 처리는 호출부에서)
 * 무료체험은 7일로 고정.
 */
export function planToExpiry(plan: Plan, paidAt: Date): Date | null {
  if (plan === "lifetime") return null;
  if (plan === "free_trial") {
    const d = new Date(paidAt);
    d.setDate(d.getDate() + 7);
    return d;
  }
  const months = PLAN_MONTHS[plan];
  if (months === null) return null;
  const d = new Date(paidAt);
  d.setMonth(d.getMonth() + months);
  return d;
}

export const PLAN_OPTIONS: { value: Plan; label: string }[] = [
  { value: "free_trial", label: "무료체험 (7일)" },
  { value: "1m", label: "1개월" },
  { value: "3m", label: "3개월" },
  { value: "6m", label: "6개월" },
  { value: "12m", label: "12개월" },
  { value: "lifetime", label: "평생" },
];

export const CHANNEL_OPTIONS: { value: Channel; label: string }[] = [
  { value: "kmong", label: "크몽" },
  { value: "toss", label: "토스 구독" },
];

// 채널별 허용 플랜
export const CHANNEL_PLANS: Record<Channel, Plan[]> = {
  kmong: ["lifetime"],
  toss: ["1m", "3m", "6m", "12m"],
  paymentteacher: ["1m", "3m", "6m", "12m"], // 미사용, DB enum 호환용
  manual: ["free_trial", "1m", "3m", "6m", "12m", "lifetime"], // 미사용, DB enum 호환용
};

// 플랜별 디폴트 금액 (KRW)
export const PLAN_DEFAULT_AMOUNT: Record<Plan, number> = {
  free_trial: 0,
  "1m": 29900,
  "3m": 79000,
  "6m": 149000,
  "12m": 249000,
  lifetime: 139000,
};
