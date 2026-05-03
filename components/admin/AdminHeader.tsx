"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AdminHeader() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <header className="border-b border-neutral-300 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/admin" className="text-sm font-semibold text-neutral-900">
          YTFINDER 어드민
        </Link>
        <nav className="flex items-center gap-3 text-xs">
          <Link href="/admin" className="text-neutral-700 hover:text-neutral-900">
            대시보드
          </Link>
          <Link href="/admin/new" className="text-neutral-700 hover:text-neutral-900">
            새 주문
          </Link>
          <Link href="/" className="text-neutral-500 hover:text-neutral-900">
            사이트로
          </Link>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded border border-neutral-300 px-2 py-1 text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
          >
            {loggingOut ? "..." : "로그아웃"}
          </button>
        </nav>
      </div>
    </header>
  );
}
