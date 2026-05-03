import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/adminAuth";

// /admin/* 접근 보호. 쿠키 없거나 유효하지 않으면 로그인 페이지로 리다이렉트.
// /admin/login 자체와 /api/admin/login은 통과.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/admin/login" || pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const ok = await isValidAdminToken(token);
    if (!ok) {
      // /api/admin/* 요청은 401 JSON, 페이지 요청은 로그인 리다이렉트
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json(
          { error: "인증이 필요합니다." },
          { status: 401 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
