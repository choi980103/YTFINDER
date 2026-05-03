"use client";

import Link from "next/link";
import ChangelogBell from "@/components/ChangelogBell";
import Logo from "@/components/Logo";

interface HeaderProps {
  onApiKeyClick: () => void;
  isConnected: boolean;
}

export default function Header({ onApiKeyClick, isConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <Logo />

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ChangelogBell />
          <Link
            href="/intro"
            className="hidden text-sm font-medium text-zinc-300 transition-colors hover:text-white sm:inline-block"
          >
            소개
          </Link>
          <Link
            href="/subscribe"
            className="hidden items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-300 transition-colors hover:bg-amber-400/20 sm:inline-flex"
          >
            요금제
          </Link>
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 sm:flex">
            <span
              className={`h-2 w-2 rounded-full ${isConnected ? "bg-[#00e5a0] pulse-green" : "bg-zinc-600"}`}
            />
            {isConnected ? "API 연동됨" : "미연동"}
          </div>
          <button
            onClick={onApiKeyClick}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:px-4 ${
              isConnected
                ? "border-[#00e5a0]/30 bg-[#00e5a0]/10 text-[#00e5a0] hover:bg-[#00e5a0]/20"
                : "border-white/10 bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full sm:hidden ${isConnected ? "bg-[#00e5a0]" : "bg-zinc-600"}`}
            />
            {isConnected ? "API 설정" : "API 연동"}
          </button>
          <Link
            href="/subscribe"
            className="inline-flex items-center rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-2 text-xs font-semibold text-amber-300 transition-colors hover:bg-amber-400/20 sm:hidden"
          >
            요금제
          </Link>
        </div>
      </div>
    </header>
  );
}
