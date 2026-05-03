import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const VALID_STATUS = new Set(["active", "revoked", "expired"]);

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 500 });
  }

  const { code } = await context.params;
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });

  const status = typeof body.status === "string" ? body.status : null;
  if (!status || !VALID_STATUS.has(status)) {
    return NextResponse.json({ error: "잘못된 상태값" }, { status: 400 });
  }

  const { data, error } = await admin
    .from("access_codes")
    .update({ status })
    .eq("code", code)
    .select()
    .single();

  if (error) {
    console.error("[admin/codes PATCH]", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, code: data });
}
