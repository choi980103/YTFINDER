"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";
import { formatKRW, getPlan, type Plan } from "@/lib/pricing";

const PENDING_KEY = "yt_pending_subscription";

interface PendingSubscription {
  planId: Plan["id"];
  customerKey: string;
  orderId: string;
  amount: number;
  orderName: string;
  ts: number;
}

type Status = "loading" | "ok" | "error";

export default function SuccessClient() {
  const params = useSearchParams();
  const authKey = params.get("authKey");
  const customerKeyParam = params.get("customerKey");

  const [pending] = useState<PendingSubscription | null>(() => {
    if (typeof window === "undefined") return null;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as PendingSubscription;
    } catch {
      return null;
    }
  });

  const isReady = Boolean(authKey && customerKeyParam && pending);

  const [status, setStatus] = useState<Status>(isReady ? "loading" : "error");
  const [message, setMessage] = useState(
    isReady ? "결제를 처리하고 있습니다..." : "결제 정보가 만료되었거나 잘못 접근하셨습니다.",
  );
  const [chargeResult, setChargeResult] = useState<unknown>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!isReady || !pending || !authKey || !customerKeyParam || fired.current) return;
    fired.current = true;

    if (customerKeyParam !== pending.customerKey) {
      setStatus("error");
      setMessage("결제 검증에 실패했습니다 (customerKey 불일치). 다시 시도해주세요.");
      return;
    }

    (async () => {
      try {
        // 1. authKey → billingKey 발급
        const issueRes = await fetch("/api/billing/issue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ authKey, customerKey: pending.customerKey }),
        });
        const issueData = await issueRes.json();
        if (!issueRes.ok) {
          throw new Error(issueData.error || "빌링키 발급 실패");
        }
        const billingKey: string = issueData.billingKey;

        // 2. 즉시 결제
        const chargeRes = await fetch("/api/billing/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            billingKey,
            customerKey: pending.customerKey,
            amount: pending.amount,
            orderId: pending.orderId,
            orderName: pending.orderName,
          }),
        });
        const chargeData = await chargeRes.json();
        if (!chargeRes.ok) {
          throw new Error(chargeData.error || "결제 실패");
        }

        setStatus("ok");
        setMessage("결제가 완료되었습니다.");
        setChargeResult(chargeData);
        sessionStorage.removeItem(PENDING_KEY);
      } catch (e) {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "결제 처리 중 오류가 발생했습니다.");
      }
    })();
  }, [authKey, customerKeyParam, isReady, pending]);

  const plan = pending ? getPlan(pending.planId) : null;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:h-16 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-xl px-5 py-16 sm:py-24">
        {status === "loading" && (
          <div className="text-center">
            <div className="mx-auto mb-6 h-10 w-10 animate-spin rounded-full border-2 border-[#00e5a0] border-t-transparent" />
            <h1 className="mb-2 text-xl font-bold text-white">{message}</h1>
            <p className="text-sm text-zinc-400">잠시만 기다려주세요. 페이지를 닫지 마세요.</p>
          </div>
        )}

        {status === "ok" && (
          <div className="rounded-2xl border border-[#00e5a0]/30 bg-[#00e5a0]/[0.04] p-6 sm:p-8">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#00e5a0]/15 text-2xl">
              ✓
            </div>
            <h1 className="mb-2 text-2xl font-bold text-white">결제 완료!</h1>
            <p className="mb-6 text-sm text-zinc-300">
              결제가 성공적으로 처리되었습니다. 영업일 1일 이내에{" "}
              <strong className="text-white">이메일로 액세스 코드</strong>를 발송해드립니다.
            </p>

            {plan && pending && (
              <dl className="space-y-2 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-zinc-400">상품</dt>
                  <dd className="text-white">{pending.orderName}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">결제 금액</dt>
                  <dd className="font-bold text-[#00e5a0]">{formatKRW(pending.amount)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-zinc-400">주문번호</dt>
                  <dd className="font-mono text-xs text-zinc-300">{pending.orderId}</dd>
                </div>
              </dl>
            )}

            <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/20 p-4 text-xs leading-relaxed text-zinc-400">
              <p className="font-semibold text-zinc-200">📮 다음 단계</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4">
                <li>가입하신 이메일을 확인해주세요 (영업일 1일 이내).</li>
                <li>전달받은 액세스 코드를 사이트 첫 화면에서 입력하시면 즉시 이용 가능합니다.</li>
                <li>문의는 <a href="mailto:seenabr00@gmail.com" className="text-[#06b6d4] underline">seenabr00@gmail.com</a></li>
              </ol>
            </div>

            <Link
              href="/"
              className="mt-6 block w-full rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-6 py-3 text-center text-sm font-bold text-[#0a0a0f] hover:opacity-90"
            >
              홈으로
            </Link>

            {chargeResult ? (
              <details className="mt-4">
                <summary className="cursor-pointer text-[11px] text-zinc-500 hover:text-zinc-300">
                  결제 응답 상세 (개발용)
                </summary>
                <pre className="mt-2 overflow-auto rounded-lg bg-black/40 p-3 text-[10px] leading-relaxed text-zinc-400">
{JSON.stringify(chargeResult, null, 2)}
                </pre>
              </details>
            ) : null}
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6 sm:p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-2xl">
              ✗
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">결제 처리 실패</h1>
            <p className="mb-6 text-sm text-zinc-300">{message}</p>
            <p className="mb-6 text-xs text-zinc-500">
              카드에서 금액이 출금되었는데 이 화면이 떴다면, 자동으로 취소 처리됩니다.
              30분 내 카드 결제 내역에 환불이 보이지 않으면{" "}
              <a href="mailto:seenabr00@gmail.com" className="text-[#06b6d4] underline">
                seenabr00@gmail.com
              </a>
              으로 주문번호와 함께 문의해주세요.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/subscribe"
                className="rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-6 py-3 text-sm font-semibold text-[#0a0a0f] hover:opacity-90"
              >
                다시 시도
              </Link>
              <Link
                href="/"
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-zinc-200 hover:bg-white/10"
              >
                홈으로
              </Link>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
