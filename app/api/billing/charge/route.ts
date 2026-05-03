import { NextRequest, NextResponse } from "next/server";

const SECRET_KEY = process.env.TOSS_SECRET_KEY;

export async function POST(req: NextRequest) {
  if (!SECRET_KEY) {
    return NextResponse.json(
      { error: "TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다." },
      { status: 500 },
    );
  }

  let body: {
    billingKey?: string;
    customerKey?: string;
    amount?: number;
    orderId?: string;
    orderName?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문" }, { status: 400 });
  }

  const { billingKey, customerKey, amount, orderId, orderName } = body;
  if (!billingKey || !customerKey || !amount || !orderId || !orderName) {
    return NextResponse.json(
      { error: "billingKey, customerKey, amount, orderId, orderName 모두 필요합니다." },
      { status: 400 },
    );
  }

  const auth = Buffer.from(`${SECRET_KEY}:`).toString("base64");

  const tossRes = await fetch(
    `https://api.tosspayments.com/v1/billing/${encodeURIComponent(billingKey)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        customerKey,
        amount,
        orderId,
        orderName,
      }),
    },
  );

  const data = await tossRes.json();
  if (!tossRes.ok) {
    console.error("[toss/charge]", { status: tossRes.status, data });
    return NextResponse.json(
      { error: data.message || "결제 실패", code: data.code, details: data },
      { status: tossRes.status },
    );
  }

  return NextResponse.json(data);
}
