"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CodeActions({
  code,
  status,
}: {
  code: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function patch(next: "active" | "revoked") {
    if (loading) return;
    const verb = next === "revoked" ? "회수" : "복구";
    if (!confirm(`${code} 코드를 ${verb}하시겠어요?`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/codes/${encodeURIComponent(code)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data?.error || `${verb} 실패`);
        return;
      }
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (status === "active") {
    return (
      <button
        onClick={() => patch("revoked")}
        disabled={loading}
        className="rounded border border-red-300 px-2 py-0.5 text-[11px] text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        회수
      </button>
    );
  }
  if (status === "revoked") {
    return (
      <button
        onClick={() => patch("active")}
        disabled={loading}
        className="rounded border border-emerald-300 px-2 py-0.5 text-[11px] text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
      >
        복구
      </button>
    );
  }
  return <span className="text-neutral-300">—</span>;
}
