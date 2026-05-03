"use client";

import { useState, useEffect } from "react";
import { loadTossPayments } from "@tosspayments/payment-sdk";

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
const STORAGE_KEY = "toss_test_billing";

interface BillingInfo {
  billingKey: string;
  customerKey: string;
  cardCompany?: string;
  cardNumber?: string;
}

export default function BillingTestPage() {
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [chargeResult, setChargeResult] = useState<unknown>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setBillingInfo(JSON.parse(stored));
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleRegisterCard = async () => {
    setError("");
    if (!CLIENT_KEY) {
      setError("NEXT_PUBLIC_TOSS_CLIENT_KEY 환경변수가 설정되지 않았습니다.");
      return;
    }
    try {
      const tossPayments = await loadTossPayments(CLIENT_KEY);
      const customerKey = `test_customer_${Date.now()}`;
      sessionStorage.setItem("toss_customer_key", customerKey);

      await tossPayments.requestBillingAuth("카드", {
        customerKey,
        successUrl: `${window.location.origin}/test/billing/success`,
        failUrl: `${window.location.origin}/test/billing/fail`,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "결제창 호출 실패");
    }
  };

  const handleCharge = async () => {
    if (!billingInfo) return;
    setLoading(true);
    setError("");
    setChargeResult(null);
    try {
      const res = await fetch("/api/billing/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingKey: billingInfo.billingKey,
          customerKey: billingInfo.customerKey,
          amount: 100,
          orderId: `test_order_${Date.now()}`,
          orderName: "YTFINDER 테스트 결제 ₩100",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "결제 실패");
        setChargeResult(data);
      } else {
        setChargeResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem("toss_customer_key");
    setBillingInfo(null);
    setChargeResult(null);
    setError("");
  };

  return (
    <main className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
      <div className="mb-10">
        <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Internal · Test</p>
        <h1 className="text-2xl font-bold text-white sm:text-3xl">토스 빌링 연동 테스트</h1>
        <p className="mt-2 text-sm text-zinc-500">
          테스트 환경 — 실 결제는 일어나지 않습니다. 카드창에 아무 카드 번호나 입력해도 OK
          (예: 4330-1234-1234-1234, 만료 12/30, 비밀번호 두 자리 00, 생년월일 0101).
        </p>
      </div>

      <section className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00e5a0]/15 text-xs font-bold text-[#00e5a0]">
            1
          </span>
          <h2 className="text-base font-bold text-white">카드 등록 (빌링 키 발급)</h2>
        </div>
        {billingInfo ? (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#00e5a0]">✓ 카드 등록 완료</p>
            <pre className="overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-400">
{JSON.stringify(billingInfo, null, 2)}
            </pre>
          </div>
        ) : (
          <button
            onClick={handleRegisterCard}
            className="rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90"
          >
            토스 카드 등록창 열기
          </button>
        )}
      </section>

      <section className="mb-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#00e5a0]/15 text-xs font-bold text-[#00e5a0]">
            2
          </span>
          <h2 className="text-base font-bold text-white">즉시 결제 테스트 (₩100)</h2>
        </div>
        <button
          onClick={handleCharge}
          disabled={!billingInfo || loading}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 disabled:opacity-40"
        >
          {loading ? "결제 중..." : billingInfo ? "₩100 결제 요청" : "먼저 카드를 등록하세요"}
        </button>
        {chargeResult ? (
          <pre className="mt-4 overflow-auto rounded-lg bg-black/40 p-3 text-[11px] leading-relaxed text-zinc-400">
{JSON.stringify(chargeResult, null, 2)}
          </pre>
        ) : null}
      </section>

      {error && (
        <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs text-red-300">
          {error}
        </div>
      )}

      {billingInfo && (
        <button
          onClick={handleReset}
          className="text-xs text-zinc-500 underline transition-colors hover:text-zinc-300"
        >
          빌링 정보 초기화
        </button>
      )}
    </main>
  );
}
