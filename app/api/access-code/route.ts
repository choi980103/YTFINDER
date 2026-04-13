import { NextResponse } from "next/server";

// 유효한 액세스 코드 목록 (서버에서만 관리)
const VALID_CODES = new Set([
  "YTFINDER-EARLY-001",
  "YTFINDER-EARLY-002",
  "YTFINDER-EARLY-003",
  "YTFINDER-EARLY-004",
  "YTFINDER-EARLY-005",
  "YTFINDER-EARLY-006",
  "YTFINDER-EARLY-007",
  "YTFINDER-EARLY-008",
  "YTFINDER-EARLY-009",
  "YTFINDER-EARLY-010",
  "YTFINDER-FREE-TRIAL",
]);

export async function POST(req: Request) {
  try {
    const { code } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ valid: false, error: "코드를 입력해주세요." }, { status: 400 });
    }

    const trimmed = code.trim().toUpperCase();

    if (VALID_CODES.has(trimmed)) {
      return NextResponse.json({ valid: true });
    }

    return NextResponse.json({ valid: false, error: "유효하지 않은 코드입니다." }, { status: 401 });
  } catch {
    return NextResponse.json({ valid: false, error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
