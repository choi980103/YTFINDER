export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5 bg-black/20 px-5 py-8 text-xs text-zinc-400">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <p className="font-semibold text-zinc-300">시나브로</p>
            <p>대표자: 최준혁 &middot; 사업자등록번호: 187-21-02241</p>
            <p>
              문의:{" "}
              <a
                href="mailto:seenabr00@gmail.com"
                className="text-zinc-400 underline decoration-dotted underline-offset-2 hover:text-zinc-200"
              >
                seenabr00@gmail.com
              </a>
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
            <a href="/intro" className="transition-colors hover:text-zinc-200">
              소개
            </a>
            <a href="/terms" className="transition-colors hover:text-zinc-200">
              이용약관
            </a>
            <a href="/privacy" className="transition-colors hover:text-zinc-200">
              개인정보처리방침
            </a>
            <a href="/refund" className="transition-colors hover:text-zinc-200">
              환불정책
            </a>
          </nav>
        </div>
        <p className="mt-6 border-t border-white/[0.04] pt-4 text-center text-[11px] text-zinc-400">
          &copy; 2026 시나브로. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
