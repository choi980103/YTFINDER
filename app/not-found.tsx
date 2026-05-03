import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:h-16 sm:px-6">
          <Logo />
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 text-center sm:min-h-[calc(100vh-4rem)]">
        <h1 className="mb-2 text-6xl font-bold tracking-tight text-white">
          4<span className="gradient-text">0</span>4
        </h1>
        <p className="mb-1 text-lg font-medium text-zinc-300">
          페이지를 찾을 수 없습니다
        </p>
        <p className="mb-8 text-sm text-zinc-500">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-6 py-3 text-sm font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90"
        >
          메인으로 돌아가기
        </Link>

        <footer className="absolute bottom-6 text-xs text-zinc-600">
          &copy; 2026 시나브로. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
