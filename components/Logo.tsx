"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface LogoProps {
  showSubtitle?: boolean;
}

export default function Logo({ showSubtitle = true }: LogoProps) {
  const pathname = usePathname();

  const handleClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <Link
      href="/"
      onClick={handleClick}
      aria-label="홈으로 이동"
      className="flex items-center gap-2 transition-opacity hover:opacity-80 sm:gap-3"
    >
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
        <span className="block text-base font-bold tracking-tight sm:text-lg">
          <span className="gradient-text">YT</span>
          <span className="text-white">FINDER</span>
        </span>
        {showSubtitle && (
          <span className="hidden text-[10px] uppercase tracking-widest text-zinc-400 sm:block">
            Rising Channel Detector
          </span>
        )}
      </div>
    </Link>
  );
}
