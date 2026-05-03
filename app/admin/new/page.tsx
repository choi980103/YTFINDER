"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/AdminHeader";
import {
  CHANNEL_OPTIONS,
  CHANNEL_PLANS,
  PLAN_DEFAULT_AMOUNT,
  PLAN_OPTIONS,
  Channel,
  Plan,
} from "@/lib/adminCodes";

const CUSTOM_AMOUNT = -1;

type SuccessResult = {
  code: string;
  expires_at: string | null;
};

export default function NewOrderPage() {
  const [channel, setChannel] = useState<Channel>("kmong");

  const allowedPlans = useMemo(() => CHANNEL_PLANS[channel], [channel]);
  const planLabelMap = useMemo(
    () => Object.fromEntries(PLAN_OPTIONS.map((o) => [o.value, o.label])),
    []
  );

  const [plan, setPlan] = useState<Plan>(allowedPlans[0]);

  const defaultAmount = PLAN_DEFAULT_AMOUNT[plan];
  const [amountChoice, setAmountChoice] = useState<number>(defaultAmount);
  const [customAmount, setCustomAmount] = useState<string>("");

  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessResult | null>(null);

  function handleChannelChange(next: Channel) {
    setChannel(next);
    const firstPlan = CHANNEL_PLANS[next][0];
    setPlan(firstPlan);
    setAmountChoice(PLAN_DEFAULT_AMOUNT[firstPlan]);
    setCustomAmount("");
  }

  function handlePlanChange(next: Plan) {
    setPlan(next);
    setAmountChoice(PLAN_DEFAULT_AMOUNT[next]);
    setCustomAmount("");
  }

  const finalAmount =
    amountChoice === CUSTOM_AMOUNT ? Number(customAmount) || 0 : amountChoice;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          plan,
          amount: finalAmount,
          email: email.trim(),
          nickname: nickname.trim(),
          note: note.trim(),
          paid_at: paidAt || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "등록 실패");
        return;
      }
      setResult({ code: data.code, expires_at: data.expires_at });
      setEmail("");
      setNickname("");
      setNote("");
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }

  function copyCode() {
    if (!result) return;
    navigator.clipboard.writeText(result.code).catch(() => {});
  }

  // 금액 드롭다운 옵션: 디폴트 + 0(무료증정) + 직접입력
  const amountOptions = Array.from(
    new Set<number>([defaultAmount, 0])
  ).sort((a, b) => b - a);

  return (
    <main className="min-h-screen bg-neutral-100">
      <AdminHeader />
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <h1 className="text-lg font-bold text-neutral-900">새 주문 등록</h1>

        {result && (
          <div className="rounded border border-emerald-300 bg-emerald-50 p-4 text-sm">
            <div className="font-semibold text-emerald-900">발급 완료</div>
            <div className="mt-2 flex items-center gap-2">
              <code className="rounded bg-white px-2 py-1 text-emerald-900">
                {result.code}
              </code>
              <button
                type="button"
                onClick={copyCode}
                className="rounded border border-emerald-400 px-2 py-1 text-xs text-emerald-800 hover:bg-emerald-100"
              >
                복사
              </button>
            </div>
            <div className="mt-2 text-xs text-emerald-800">
              만료일:{" "}
              {result.expires_at
                ? new Date(result.expires_at).toLocaleString("ko-KR")
                : "영구"}
            </div>
            <div className="mt-3 flex gap-2 text-xs">
              <Link
                href="/admin"
                className="rounded bg-emerald-700 px-2 py-1 font-medium text-white"
              >
                대시보드로
              </Link>
            </div>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded border border-neutral-300 bg-white p-5"
        >
          <Field label="채널">
            <select
              value={channel}
              onChange={(e) => handleChannelChange(e.target.value as Channel)}
              className="w-full rounded border border-neutral-400 px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            >
              {CHANNEL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="플랜">
            <select
              value={plan}
              onChange={(e) => handlePlanChange(e.target.value as Plan)}
              className="w-full rounded border border-neutral-400 px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            >
              {allowedPlans.map((p) => (
                <option key={p} value={p}>
                  {planLabelMap[p]}
                </option>
              ))}
            </select>
          </Field>

          <Field label="금액">
            <select
              value={amountChoice}
              onChange={(e) => setAmountChoice(Number(e.target.value))}
              className="w-full rounded border border-neutral-400 px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            >
              {amountOptions.map((amt) => (
                <option key={amt} value={amt}>
                  {amt === 0 ? "무료 증정 (₩0)" : `₩${amt.toLocaleString("ko-KR")}`}
                </option>
              ))}
              <option value={CUSTOM_AMOUNT}>직접 입력...</option>
            </select>
            {amountChoice === CUSTOM_AMOUNT && (
              <input
                type="number"
                min={0}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="원 단위 입력"
                className="mt-2 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm"
              />
            )}
          </Field>

          <Field label="이메일">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full rounded border border-neutral-400 px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </Field>

          <Field label="닉네임 (선택)">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="크몽 닉네임 등"
              className="w-full rounded border border-neutral-400 px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </Field>

          <Field label="결제일 (선택, 미입력 시 현재시각)">
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="w-full rounded border border-neutral-400 px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </Field>

          <Field label="메모 (선택)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full rounded border border-neutral-400 px-2.5 py-2 text-sm text-neutral-900 placeholder:text-neutral-400"
            />
          </Field>

          {error && (
            <div className="rounded border border-red-300 bg-red-50 p-2 text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "등록 중..." : "주문 등록 + 코드 발급"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-neutral-900">{label}</span>
      {children}
    </label>
  );
}
