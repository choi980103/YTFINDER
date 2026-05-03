import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_MAX_AGE,
  ADMIN_COOKIE_NAME,
  adminTokenFromPassword,
  verifyAdminPassword,
} from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const password = body && typeof body === "object" ? (body as { password?: unknown }).password : undefined;

  if (typeof password !== "string" || password.length === 0) {
    return NextResponse.json({ error: "비밀번호를 입력해주세요." }, { status: 400 });
  }

  const ok = await verifyAdminPassword(password);
  if (!ok) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    console.warn("[admin/login] failed", { ip });
    return NextResponse.json({ error: "비밀번호가 올바르지 않습니다." }, { status: 401 });
  }

  const token = await adminTokenFromPassword(password);
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: ADMIN_COOKIE_MAX_AGE,
  });
  return res;
}
