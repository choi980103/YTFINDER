"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { loadTossPayments } from "@tosspayments/payment-sdk";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PLANS, formatKRW, type Plan } from "@/lib/pricing";
import { generateCustomerKey, generateOrderId, nowMs } from "@/lib/ids";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;

function SubscribeContent() {
  const params = useSearchParams();
  const planParam = params.get("plan");

  const initialPlanId =
    planParam && PLANS.find((p) => p.id === planParam) ? planParam : "12m";

  const [selectedId, setSelectedId] = useState<Plan["id"]>(initialPlanId as Plan["id"]);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const selected = PLANS.find((p) => p.id === selectedId)!;

  const handleCheckout = async () => {
    setError("");
    if (!agreed) {
      setError("약관 및 환불정책에 동의해주세요.");
      return;
    }
    if (!CLIENT_KEY) {
      setError("결제 모듈이 설정되지 않았습니다. 관리자에게 문의해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const customerKey = generateCustomerKey();
      const orderId = generateOrderId();

      // 결제 완료 시 success 페이지에서 사용
      sessionStorage.setItem(
        "yt_pending_subscription",
        JSON.stringify({
          planId: selected.id,
          customerKey,
          orderId,
          amount: selected.price,
          orderName: `YTFINDER ${selected.label} 구독`,
          ts: nowMs(),
        }),
      );

      await tossPayments.requestBillingAuth("카드", {
        customerKey,
        successUrl: `${window.location.origin}/subscribe/success`,
        failUrl: `${window.location.origin}/subscribe/fail`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제창 호출에 실패했습니다.");
      setSubmitting(false);
    }
  };

  return (
    <>
      <SiteHeader />

      <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:py-16">
        <div className="mb-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Subscribe</p>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">구독 시작하기</h1>
          <p className="mt-2 text-sm text-zinc-400">
            기간을 선택하고 결제를 진행해주세요. 결제 완료 후 이메일로 액세스 코드를 발송해드립니다.
          </p>
        </div>

        {/* 플랜 선택 */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-zinc-200">1. 플랜 선택</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {PLANS.map((plan) => {
              const isSelected = plan.id === selectedId;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedId(plan.id)}
                  className={`relative rounded-2xl border p-5 text-left transition-all ${
                    isSelected
                      ? "border-[#00e5a0]/50 bg-[#00e5a0]/[0.06] ring-1 ring-[#00e5a0]/40"
                      : "border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  {plan.badge && (
                    <span
                      className={`absolute -top-2 right-4 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                        plan.highlight
                          ? "bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] text-[#0a0a0f]"
                          : "bg-white/10 text-zinc-200"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-base font-bold text-white">{plan.label}</h3>
                    {plan.discount > 0 && (
                      <span className="text-xs font-bold text-[#00e5a0]">-{plan.discount}%</span>
                    )}
                  </div>
                  <div className="mt-2 text-xl font-black text-white">{formatKRW(plan.price)}</div>
                  <p className="mt-1 text-xs text-zinc-400">월 {formatKRW(plan.monthly)} 환산</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* 결제 요약 */}
        <section className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-6">
          <h2 className="mb-4 text-sm font-semibold text-zinc-200">2. 결제 요약</h2>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-400">상품</dt>
              <dd className="text-white">YTFINDER {selected.label} 구독</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">기간</dt>
              <dd className="text-white">{selected.months}개월</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-400">월 환산</dt>
              <dd className="text-zinc-300">{formatKRW(selected.monthly)}</dd>
            </div>
            <div className="border-t border-white/[0.08] pt-2.5" />
            <div className="flex justify-between text-base">
              <dt className="font-semibold text-white">결제 금액 (부가세 포함)</dt>
              <dd className="font-black text-[#00e5a0]">{formatKRW(selected.price)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-zinc-300">
            ⓘ 약정 기간 만료 시점에 동일 조건으로 자동 갱신됩니다. 언제든 자동결제를 해지할 수 있으며,
            이미 결제된 기간은 만료일까지 정상 이용 가능합니다.
          </p>
        </section>

        {/* 약관 동의 */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold text-zinc-200">3. 약관 동의</h2>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] p-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#00e5a0]"
            />
            <span className="text-xs leading-relaxed text-zinc-300">
              <Link href="/terms" target="_blank" className="text-[#06b6d4] underline underline-offset-2">
                이용약관
              </Link>
              ,{" "}
              <Link href="/privacy" target="_blank" className="text-[#06b6d4] underline underline-offset-2">
                개인정보처리방침
              </Link>
              ,{" "}
              <Link href="/refund" target="_blank" className="text-[#06b6d4] underline underline-offset-2">
                환불정책
              </Link>
              에 동의하며, 자동결제 갱신 및 결제 정보 수집에 동의합니다.
            </span>
          </label>
        </section>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={handleCheckout}
          disabled={!agreed || submitting}
          className="w-full rounded-2xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-6 py-4 text-base font-bold text-[#0a0a0f] shadow-lg shadow-[#00e5a0]/20 transition-all hover:shadow-[#00e5a0]/30 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {submitting ? "결제창 여는 중..." : `${formatKRW(selected.price)} 결제하기`}
        </button>

        <p className="mt-4 text-center text-xs text-zinc-300">
          🔒 카드 정보는 토스페이먼츠가 직접 처리하며, 회사는 카드 정보를 저장하지 않습니다.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}

export default function SubscribePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-5 py-20 text-center text-sm text-zinc-400">
          로딩 중...
        </main>
      }
    >
      <SubscribeContent />
    </Suspense>
  );
}
