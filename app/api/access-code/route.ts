import { NextResponse } from "next/server";

// 환경변수에서 액세스 코드 로드 (쉼표 구분)
const VALID_CODES = new Set(
  (process.env.ACCESS_CODES || "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
);

// 브루트포스 방지: IP별 실패 횟수 추적
const failureMap = new Map<string, { count: number; lockedUntil: number }>();
const MAX_FAILURES = 5;
const LOCK_DURATION = 30 * 60 * 1000; // 30분

function cleanupExpired() {
  const now = Date.now();
  for (const [ip, record] of failureMap) {
    if (record.lockedUntil < now) failureMap.delete(ip);
  }
}

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    // 주기적 정리
    if (failureMap.size > 1000) cleanupExpired();

    // 잠금 확인
    const record = failureMap.get(ip);
    if (record && record.lockedUntil > Date.now()) {
      const remaining = Math.ceil(
        (record.lockedUntil - Date.now()) / 60000
      );
      return NextResponse.json(
        {
          valid: false,
          error: `너무 많은 시도가 있었습니다. ${remaining}분 후에 다시 시도해주세요.`,
        },
        { status: 429 }
      );
    }

    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { valid: false, error: "코드를 입력해주세요." },
        { status: 400 }
      );
    }

    const trimmed = code.trim().toUpperCase();

    if (VALID_CODES.has(trimmed)) {
      // 성공 시 실패 기록 초기화
      failureMap.delete(ip);
      return NextResponse.json({ valid: true });
    }

    // 실패 횟수 증가
    const current = failureMap.get(ip) || { count: 0, lockedUntil: 0 };
    current.count += 1;
    if (current.count >= MAX_FAILURES) {
      current.lockedUntil = Date.now() + LOCK_DURATION;
      failureMap.set(ip, current);
      return NextResponse.json(
        {
          valid: false,
          error: `${MAX_FAILURES}회 실패하여 30분간 잠금되었습니다.`,
        },
        { status: 429 }
      );
    }
    failureMap.set(ip, current);

    return NextResponse.json(
      {
        valid: false,
        error: `유효하지 않은 코드입니다. (${current.count}/${MAX_FAILURES}회 실패)`,
      },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { valid: false, error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
