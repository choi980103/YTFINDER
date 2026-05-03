import { NextRequest, NextResponse } from "next/server";
import { isValidAccessCodeFormat } from "@/lib/validate";
import { checkAccessCode } from "@/lib/accessCodes";

/**
 * API 라우트에서 액세스 코드 인증 확인.
 * 헤더 x-access-code가 유효하지 않으면 401 응답을 반환.
 */
export async function verifyAccess(
  request: NextRequest
): Promise<NextResponse | null> {
  const raw = request.headers.get("x-access-code");
  if (!isValidAccessCodeFormat(raw)) {
    return NextResponse.json(
      { error: "인증이 필요합니다. 액세스 코드를 확인해주세요." },
      { status: 401 }
    );
  }
  const result = await checkAccessCode(raw);
  if (!result.valid) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    console.warn("[verifyAccess] rejected", { ip, reason: result.reason });
    return NextResponse.json(
      { error: "인증이 필요합니다. 액세스 코드를 확인해주세요." },
      { status: 401 }
    );
  }
  return null;
}
