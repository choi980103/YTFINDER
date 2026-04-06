"use client";

import { useState } from "react";

interface LandingHeroProps {
  onGetStarted: () => void;
  onSkip: () => void;
}

export default function LandingHero({ onGetStarted, onSkip }: LandingHeroProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 text-center">
      {/* Logo / Title */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00e5a0] to-[#06b6d4] shadow-lg shadow-[#00e5a0]/20">
          <svg className="h-7 w-7 text-[#0a0a0f]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
          YT<span className="gradient-text">FINDER</span>
        </h1>
      </div>

      {/* Tagline */}
      <p className="mb-2 text-lg font-semibold text-zinc-200 sm:text-xl">
        쇼츠 떡상 채널을 가장 먼저 발견하세요
      </p>
      <p className="mb-10 max-w-lg text-sm leading-relaxed text-zinc-500">
        구독자 대비 조회수가 비정상적으로 높은 채널 = 알고리즘이 밀어주는 떡상 직전 채널.
        YTFINDER가 실시간 YouTube 데이터를 분석해서 숨겨진 보석 같은 채널을 찾아드립니다.
      </p>

      {/* Feature Cards */}
      <div className="mb-10 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left backdrop-blur-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#00e5a0]/10">
            <svg className="h-5 w-5 text-[#00e5a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-white">떡상 지수</h3>
          <p className="mt-1 text-xs text-zinc-500">조회/구독 비율 + 성장률 + 활동량을 종합 분석한 독자적 스코어링</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left backdrop-blur-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-[#06b6d4]/10">
            <svg className="h-5 w-5 text-[#06b6d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-white">한국 + 해외</h3>
          <p className="mt-1 text-xs text-zinc-500">한국뿐 아니라 미국, 일본 등 글로벌 쇼츠 트렌드도 한눈에</p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-left backdrop-blur-sm">
          <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
            <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-white">히든 젬 발견</h3>
          <p className="mt-1 text-xs text-zinc-500">아직 덜 알려졌지만 폭발적 성장 중인 채널을 자동으로 발굴</p>
        </div>
      </div>

      {/* How it works */}
      <div className="mb-10 max-w-lg">
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-600">이용 방법</h3>
        <div className="flex items-start gap-4 text-left">
          <div className="flex flex-col items-center gap-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00e5a0]/20 text-xs font-bold text-[#00e5a0]">1</div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#06b6d4]/20 text-xs font-bold text-[#06b6d4]">2</div>
            <div className="h-8 w-px bg-white/10" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-purple-400/20 text-xs font-bold text-purple-400">3</div>
          </div>
          <div className="flex flex-col gap-[22px]">
            <div>
              <p className="text-sm font-semibold text-zinc-200">YouTube API 키 발급</p>
              <p className="text-xs text-zinc-500">Google Cloud Console에서 무료로 발급 (5분)</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">API 키 입력</p>
              <p className="text-xs text-zinc-500">상단 설정에서 키를 입력하면 실시간 데이터 연동</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">떡상 채널 분석</p>
              <p className="text-xs text-zinc-500">300+ 채널을 AI가 분석해서 떡상 가능성 순으로 정렬</p>
            </div>
          </div>
        </div>
      </div>

      {/* API 키 발급 가이드 */}
      <div className="mb-10 w-full max-w-xl">
        <button
          onClick={() => setGuideOpen((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-3.5 text-left transition-all hover:bg-white/[0.04]"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-400/10">
              <svg className="h-4 w-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-zinc-200">YouTube API 키 발급 방법</span>
          </div>
          <svg
            className={`h-5 w-5 text-zinc-500 transition-transform ${guideOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {guideOpen && (
          <div className="mt-2 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 text-left">
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00e5a0]/20 text-[11px] font-bold text-[#00e5a0]">1</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">Google Cloud Console 접속</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-[#06b6d4] underline underline-offset-2 hover:text-[#00e5a0]">
                      console.cloud.google.com
                    </a>
                    {" "}접속 후 Google 계정으로 로그인
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00e5a0]/20 text-[11px] font-bold text-[#00e5a0]">2</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">프로젝트 만들기</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    상단 &quot;프로젝트 선택&quot; 클릭 → &quot;새 프로젝트&quot; → 이름 아무거나 입력 (예: ytfinder) → &quot;만들기&quot;
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#06b6d4]/20 text-[11px] font-bold text-[#06b6d4]">3</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">YouTube API 활성화</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    왼쪽 메뉴 &quot;API 및 서비스&quot; → &quot;라이브러리&quot; → &quot;YouTube Data API v3&quot; 검색 → &quot;사용&quot; 클릭
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#06b6d4]/20 text-[11px] font-bold text-[#06b6d4]">4</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">API 키 발급</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    &quot;API 및 서비스&quot; → &quot;사용자 인증 정보&quot; → &quot;+ 사용자 인증 정보 만들기&quot; → &quot;API 키&quot; → 키 복사!
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-400/20 text-[11px] font-bold text-purple-400">5</div>
                <div>
                  <p className="text-sm font-semibold text-zinc-200">사이트에서 사용</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    아래 &quot;API 키 연동하고 시작하기&quot; 클릭 → 복사한 키 붙여넣기 → 완료!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-amber-400/5 border border-amber-400/10 px-3 py-2">
              <p className="text-[11px] text-amber-400/80">
                무료로 하루 10,000 유닛 사용 가능합니다. YTFINDER는 1회 분석에 약 800 유닛을 사용하며, 캐시가 적용되어 대부분의 접속은 0 유닛입니다.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <button
          onClick={onGetStarted}
          className="rounded-2xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-8 py-3.5 text-sm font-bold text-[#0a0a0f] shadow-lg shadow-[#00e5a0]/20 transition-all hover:shadow-[#00e5a0]/30 hover:scale-[1.02] active:scale-[0.98]"
        >
          API 키 연동하고 시작하기
        </button>
        <button
          onClick={onSkip}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-zinc-200"
        >
          샘플 데이터로 둘러보기
        </button>
      </div>

      {/* Trust line */}
      <p className="mt-6 text-[11px] text-zinc-600">
        API 키는 브라우저에만 저장되며 서버에 보관되지 않습니다
      </p>
    </div>
  );
}
