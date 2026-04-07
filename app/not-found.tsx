import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4 text-center">
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
  );
}
