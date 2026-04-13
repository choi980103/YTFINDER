import { NextRequest, NextResponse } from "next/server";

const VALID_CODES = new Set(
  (process.env.ACCESS_CODES || "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
);

/**
 * API 라우트에서 액세스 코드 인증 확인.
 * 헤더 x-access-code가 유효하지 않으면 401 응답을 반환.
 */
export function verifyAccess(
  request: NextRequest
): NextResponse | null {
  const code = request.headers.get("x-access-code")?.trim().toUpperCase();
  if (!code || !VALID_CODES.has(code)) {
    return NextResponse.json(
      { error: "인증이 필요합니다. 액세스 코드를 확인해주세요." },
      { status: 401 }
    );
  }
  return null;
}
