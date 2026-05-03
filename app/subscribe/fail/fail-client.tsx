"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import SiteFooter from "@/components/SiteFooter";

export default function FailClient() {
  const params = useSearchParams();
  const code = params.get("code");
  const message = params.get("message");

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:h-16 sm:px-6">
          <Logo />
        </div>
      </header>

      <main className="mx-auto min-h-screen max-w-xl px-5 py-16 sm:py-24">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/[0.04] p-6 sm:p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-2xl">
            ✗
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">결제가 취소되었습니다</h1>
          <p className="mb-2 text-sm text-zinc-300">{message || "사용자가 결제를 취소했거나 오류가 발생했습니다."}</p>
          {code && (
            <p className="mb-6 text-[11px] font-mono text-zinc-500">에러 코드: {code}</p>
          )}
          <p className="mb-6 text-xs text-zinc-500">
            카드 등록 단계에서 취소된 경우 결제는 진행되지 않습니다.
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
      </main>

      <SiteFooter />
    </>
  );
}
