"use client";

import ChangelogBell from "@/components/ChangelogBell";

interface HeaderProps {
  onApiKeyClick: () => void;
  isConnected: boolean;
}

export default function Header({ onApiKeyClick, isConnected }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00e5a0] to-[#06b6d4] sm:h-9 sm:w-9">
            <svg
              className="h-4 w-4 text-[#0a0a0f] sm:h-5 sm:w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight sm:text-lg">
              <span className="gradient-text">YT</span>
              <span className="text-white">FINDER</span>
            </h1>
            <p className="hidden text-[10px] uppercase tracking-widest text-zinc-500 sm:block">
              Rising Channel Detector
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          <ChangelogBell />
          <div className="hidden items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-400 sm:flex">
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
        </div>
      </div>
    </header>
  );
}
