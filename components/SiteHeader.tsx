import Link from "next/link";
import Logo from "@/components/Logo";

// 비-앱 페이지용 공통 헤더 (privacy/refund/terms/subscribe/channel 등)
// 메인 앱 페이지(/)는 Header.tsx 사용.
export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Logo />
        <Link
          href="/subscribe"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[#00e5a0]/30 bg-[#00e5a0]/10 px-3 py-1.5 text-sm font-semibold text-[#00e5a0] transition-colors hover:bg-[#00e5a0]/20"
        >
          요금제
        </Link>
      </div>
    </header>
  );
}
