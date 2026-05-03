"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

const STORAGE_KEY = "toss_test_billing";

export default function SuccessClient() {
  const params = useSearchParams();
  const router = useRouter();
  const authKey = params.get("authKey");
  const customerKey = params.get("customerKey");
  const hasParams = Boolean(authKey && customerKey);

  const [status, setStatus] = useState<"loading" | "ok" | "error">(
    hasParams ? "loading" : "error",
  );
  const [message, setMessage] = useState(
    hasParams ? "" : "authKey 또는 customerKey가 없습니다.",
  );
  const [details, setDetails] = useState<unknown>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (!hasParams || fired.current) return;
    fired.current = true;

    fetch("/api/billing/issue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authKey, customerKey }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setDetails(data);
          throw new Error(data.error || "billingKey 발급 실패");
        }
        const card = data.card || {};
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            billingKey: data.billingKey,
            customerKey,
            cardCompany: card.company,
            cardNumber: card.number,
          }),
        );
        setStatus("ok");
        setMessage("billingKey 발급 완료. 잠시 후 메인으로 이동합니다.");
        setDetails(data);
        setTimeout(() => router.push("/test/billing"), 1500);
      })
      .catch((e) => {
        setStatus("error");
        setMessage(e instanceof Error ? e.message : "오류");
      });
  }, [authKey, customerKey, hasParams, router]);

  return (
    <main className="mx-auto max-w-md px-5 py-20 text-center">
      <h1 className="mb-4 text-xl font-bold text-white">
        {status === "loading" && "처리 중..."}
        {status === "ok" && "✓ 카드 등록 완료"}
        {status === "error" && "✗ 발급 실패"}
      </h1>
      <p className="mb-4 text-sm text-zinc-300">{message}</p>
      {details ? (
        <pre className="mt-4 overflow-auto rounded-lg bg-black/40 p-3 text-left text-[11px] leading-relaxed text-zinc-400">
{JSON.stringify(details, null, 2)}
        </pre>
      ) : null}
      {status === "error" && (
        <Link href="/test/billing" className="mt-6 inline-block text-xs text-[#00e5a0] underline">
          돌아가기
        </Link>
      )}
    </main>
  );
}
