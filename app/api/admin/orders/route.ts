import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  Channel,
  Plan,
  generateUniqueCode,
  planToExpiry,
} from "@/lib/adminCodes";

const VALID_PLANS: Plan[] = ["free_trial", "1m", "3m", "6m", "12m", "lifetime"];
const VALID_CHANNELS: Channel[] = ["kmong", "paymentteacher", "toss", "manual"];

function isPlan(v: unknown): v is Plan {
  return typeof v === "string" && (VALID_PLANS as string[]).includes(v);
}
function isChannel(v: unknown): v is Channel {
  return typeof v === "string" && (VALID_CHANNELS as string[]).includes(v);
}

export async function POST(req: NextRequest) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Supabase 미설정" },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const { channel, plan, amount, email, nickname, note, paid_at } = body;

  if (!isChannel(channel)) return NextResponse.json({ error: "채널이 잘못되었습니다." }, { status: 400 });
  if (!isPlan(plan)) return NextResponse.json({ error: "플랜이 잘못되었습니다." }, { status: 400 });
  const amountNum = Number(amount);
  if (!Number.isFinite(amountNum) || amountNum < 0) {
    return NextResponse.json({ error: "금액이 잘못되었습니다." }, { status: 400 });
  }

  const emailStr = typeof email === "string" && email.trim() ? email.trim() : null;
  const nicknameStr = typeof nickname === "string" && nickname.trim() ? nickname.trim() : null;
  const noteStr = typeof note === "string" && note.trim() ? note.trim() : null;
  const paidAtDate = typeof paid_at === "string" && paid_at ? new Date(paid_at) : new Date();
  if (Number.isNaN(paidAtDate.getTime())) {
    return NextResponse.json({ error: "결제일이 잘못되었습니다." }, { status: 400 });
  }

  let code: string;
  try {
    code = await generateUniqueCode(plan);
  } catch (err) {
    console.error("[admin/orders] code gen failed", err);
    return NextResponse.json({ error: "코드 생성 실패" }, { status: 500 });
  }

  const expiresAt = planToExpiry(plan, paidAtDate);

  // 1) access_codes INSERT
  const { error: codeErr } = await admin.from("access_codes").insert({
    code,
    status: "active",
    plan,
    customer_email: emailStr,
    customer_nickname: nicknameStr,
    issued_at: paidAtDate.toISOString(),
    expires_at: expiresAt ? expiresAt.toISOString() : null,
    note: noteStr,
  });
  if (codeErr) {
    console.error("[admin/orders] access_codes insert failed", codeErr);
    return NextResponse.json({ error: codeErr.message }, { status: 500 });
  }

  // 2) orders INSERT
  const { data: orderData, error: orderErr } = await admin
    .from("orders")
    .insert({
      customer_email: emailStr,
      customer_nickname: nicknameStr,
      channel,
      amount: Math.floor(amountNum),
      plan,
      access_code: code,
      paid_at: paidAtDate.toISOString(),
      note: noteStr,
    })
    .select()
    .single();

  if (orderErr) {
    console.error("[admin/orders] orders insert failed", orderErr);
    // access_codes는 이미 INSERT됐으나 orders 실패 — 일관성을 위해 access_codes 롤백
    await admin.from("access_codes").delete().eq("code", code);
    return NextResponse.json({ error: orderErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    order: orderData,
    code,
    expires_at: expiresAt ? expiresAt.toISOString() : null,
  });
}
