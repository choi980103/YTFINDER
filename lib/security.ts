import { NextRequest, NextResponse } from "next/server";

/**
 * 내부 에러를 로깅하고 외부에는 일반 메시지만 반환.
 * YouTube API 원본 에러(할당량, 권한 등)가 클라이언트에 노출되는 것을 방지.
 */
export function maskError(
  context: string,
  error: unknown,
  publicMessage = "요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
): NextResponse {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`[${context}]`, detail);
  // 한글 메시지는 개발자가 직접 던진 사용자용 안내로 간주하고 그대로 노출.
  // 그 외(스택 트레이스/내부 기술 오류)는 마스킹.
  const isSafeMessage =
    error instanceof Error && /[가-힣]/.test(error.message);
  const message = isSafeMessage ? error.message : publicMessage;
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * 같은 출처(same-origin)에서 온 요청인지 Origin/Referer 헤더로 확인.
 * CSRF 기본 방어. 서버 간 호출이나 cron은 통과 대상이 아님.
 */
export function verifySameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const allowed = new Set<string>();
  allowed.add(`https://${host}`);
  allowed.add(`http://${host}`);
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) allowed.add(envUrl.replace(/\/$/, ""));

  const source = origin || (referer ? new URL(referer).origin : null);
  if (!source) {
    console.warn("[security] missing origin/referer", { host });
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 403 });
  }

  if (!allowed.has(source)) {
    console.warn("[security] cross-origin blocked", { source, host });
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 403 });
  }

  return null;
}

/**
 * 요청자의 IP. Vercel은 x-forwarded-for의 첫 번째 값이 실제 클라이언트.
 */
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
