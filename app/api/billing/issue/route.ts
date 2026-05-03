import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.TOSS_SECRET_KEY;
const TOSS_API = "https://api.tosspayments.com/v1/billing/authorizations/issue";

export async function POST(req: NextRequest) {
  if (!SECRET_KEY) {
    return NextResponse.json(
      { error: "TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  let body: { authKey?: string; customerKey?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const { authKey, customerKey } = body;
  if (!authKey || !customerKey) {
    return NextResponse.json(
      { error: "authKey, customerKey가 필요합니다." },
      { status: 400 },
    );
  }

  const auth = Buffer.from(`${SECRET_KEY}:`).toString("base64");

  const tossRes = await fetch(TOSS_API, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ authKey, customerKey }),
  });

  const data = await tossRes.json();
  if (!tossRes.ok) {
    console.error("[toss/issue]", { status: tossRes.status, data });
    return NextResponse.json(
      { error: data.message || "billingKey 발급 실패", code: data.code, details: data },
      { status: tossRes.status },
    );
  }

  return NextResponse.json(data);
}
