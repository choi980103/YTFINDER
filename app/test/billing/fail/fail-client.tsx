"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function FailClient() {
  const params = useSearchParams();
  const code = params.get("code");
  const message = params.get("message");

  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="mb-4 text-xl font-bold text-white">✗ 카드 등록 실패</h1>
      <p className="text-sm text-zinc-400">
        [{code || "UNKNOWN"}] {message || "원인 불명"}
      </p>
      <Link
        href="/test/billing"
        className="mt-6 inline-block text-xs text-[#00e5a0] underline"
      >
        다시 시도
      </Link>
    </main>
  );
}
