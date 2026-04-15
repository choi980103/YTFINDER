"use client";

import { useState, useEffect, useRef } from "react";

// ── 설정 ──
const REQUIRE_ALL = true;
const STORAGE_KEY = "yt_access_code";

interface AccessCodeGateProps {
  children: React.ReactNode;
}

export default function AccessCodeGate({ children }: AccessCodeGateProps) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedCode = localStorage.getItem(STORAGE_KEY);
    if (storedCode) {
      // 저장된 코드를 서버에서 재검증
      fetch("/api/access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: storedCode }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsAuthorized(true);
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => {
          // 네트워크 오류 시 일단 통과 (오프라인 대응)
          setIsAuthorized(true);
        })
        .finally(() => setIsChecking(false));
      return;
    }
    if (!REQUIRE_ALL) {
      const hasApiKey = localStorage.getItem("yt_api_key");
      if (hasApiKey) {
        setIsAuthorized(true);
        setIsChecking(false);
        return;
      }
    }
    setIsChecking(false);
  }, []);

  const handleSubmit = async () => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    try {
      const res = await fetch("/api/access-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: trimmed }),
      });
      const data = await res.json();
      if (data.valid) {
        localStorage.setItem(STORAGE_KEY, trimmed);
        setSuccess(true);
        setError("");
        setTimeout(() => setIsAuthorized(true), 800);
      } else {
        setError(data.error || "유효하지 않은 코드입니다.");
        setSuccess(false);
      }
    } catch {
      setError("서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.");
      setSuccess(false);
    }
  };

  const scrollToCode = () => {
    codeRef.current?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => codeRef.current?.focus(), 500);
  };

  if (isChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#00e5a0] border-t-transparent" />
      </div>
    );
  }

  if (isAuthorized) return <>{children}</>;

  // ── 소개 페이지 + 코드 입력 ──
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
    <div className="mx-auto max-w-4xl">

      {/* ██ HERO ██ */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28 sm:pb-20">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,229,160,0.08),transparent_60%)]" />

        {/* 한정 특가 배지 */}
        <div className="relative mb-8 inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-4 py-1.5 text-xs font-bold text-red-400 sm:text-sm">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
          초기 멤버 한정 특가 — 곧 가격이 인상됩니다
        </div>

        {/* 로고 */}
        <div className="relative mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00e5a0] to-[#06b6d4] shadow-lg shadow-[#00e5a0]/20 sm:h-14 sm:w-14">
            <svg className="h-6 w-6 text-[#0a0a0f] sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            YT<span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">FINDER</span>
          </h1>
        </div>

        <p className="relative mb-2 text-lg font-semibold text-zinc-200 sm:text-xl">숨겨진 꿀통 채널을 가장 먼저 발견하세요</p>
        <p className="relative mx-auto mb-10 max-w-lg text-sm leading-relaxed text-zinc-500">
          쇼츠로 실제 수익을 내고 있는 숨겨진 채널, 알고리즘이 밀어주는 진짜 꿀통을 찾아드립니다.
          실시간 YouTube 데이터를 분석해서 수익성 높은 채널을 발굴합니다.
        </p>

        {/* 가격 박스 */}
        <div className="relative inline-flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.03] px-8 py-6 sm:px-12 sm:py-7">
          <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-3.5 py-1.5 text-[11px] font-extrabold tracking-wider text-white shadow-lg shadow-red-500/35">
            🔥 런칭 기념 50% OFF
          </span>
          <span className="text-xs text-zinc-500">평생이용권 (초기 멤버 한정)</span>
          <span className="mt-1 text-sm text-zinc-600 line-through">정가 ₩299,000</span>
          <span className="mt-1 flex items-center gap-3 text-4xl font-black sm:text-5xl">
            <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">₩149,000</span>
            <span className="rounded-lg bg-red-500 px-2 py-0.5 text-base font-black text-white sm:text-lg">-50%</span>
          </span>
          <span className="mt-2 text-xs font-semibold text-red-400">⚡ 지금이 <b className="text-red-300">반값</b>으로 평생 이용할 수 있는 마지막 기회 · 100개 판매마다 인상</span>
        </div>

        {/* CTA */}
        <div className="relative mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={scrollToCode} className="rounded-2xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-8 py-3.5 text-sm font-bold text-[#0a0a0f] shadow-lg shadow-[#00e5a0]/20 transition-all hover:shadow-[#00e5a0]/30 hover:scale-[1.02] active:scale-[0.98]">
            액세스 코드 입력하기
          </button>
          <a href="https://kmong.com" target="_blank" rel="noopener noreferrer" className="rounded-2xl border border-white/10 bg-white/[0.03] px-8 py-3.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.06] hover:text-zinc-200">
            구매하러 가기
          </a>
        </div>
      </section>

      {/* ██ STATS ██ */}
      <div className="grid grid-cols-2 gap-4 px-4 py-10 sm:flex sm:justify-center sm:gap-16 sm:px-6 sm:py-12">
        {[
          { n: "300+", l: "분석 채널 수" },
          { n: "15+", l: "분석 카테고리" },
          { n: "24/7", l: "실시간 업데이트" },
          { n: "100%", l: "웹 기반" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-2xl font-black sm:text-4xl"><span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">{s.n}</span></div>
            <div className="mt-1 text-xs text-zinc-500 sm:text-sm">{s.l}</div>
          </div>
        ))}
      </div>

      {/* ██ PAIN POINTS ██ */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Problem</p>
        <h2 className="mb-8 text-2xl font-black sm:text-3xl">이런 고민, 해보셨나요?</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: "😩", t: "수익 나는 채널을 찾기 어렵다", d: "진짜 돈이 되는 꿀통 채널은 어디 있는지, 어떤 콘텐츠가 수익성이 높은지 감이 안 잡히죠." },
            { icon: "🔍", t: "경쟁 채널 분석이 번거롭다", d: "하나하나 찾아보기엔 시간이 너무 오래 걸리고 체계적으로 비교하기 어렵습니다." },
            { icon: "📉", t: "내 채널 성장이 정체됐다", d: "구독자는 안 늘고, 수익도 안 나고... 뭘 해야 성장할 수 있는지 파악이 안 됩니다." },
            { icon: "💸", t: "다른 분석 툴은 비싸다", d: "월 구독료가 부담스럽고, 한국 쇼츠 시장에 맞지 않는 기능만 잔뜩 있습니다." },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7">
              <div className="mb-3 text-2xl">{c.icon}</div>
              <h3 className="mb-1.5 text-base font-bold text-zinc-100">{c.t}</h3>
              <p className="text-sm leading-relaxed text-zinc-500">{c.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ██ FEATURES ██ */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Solution</p>
        <h2 className="mb-2 text-2xl font-black sm:text-3xl">YTFINDER가 <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">전부 해결</span>합니다</h2>
        <p className="mb-10 text-sm text-zinc-500">현직 유튜브 크리에이터 4년차가 직접 만든 분석 도구. 진짜 필요한 기능만 담았습니다.</p>

        <div className="flex flex-col gap-4">
          {[
            { icon: "📊", bg: "rgba(0,229,160,0.1)", t: "꿀통 지수 스코어링", d: "조회수/구독자 비율 + 수익성 + 성장률을 종합 분석한 독자적 스코어링 시스템. 숨겨진 꿀통 채널을 숫자로 확인하세요.", tag: "핵심 기능", tagColor: "#00e5a0" },
            { icon: "🌍", bg: "rgba(6,182,212,0.1)", t: "글로벌 트렌드 분석", d: "한국뿐 아니라 미국, 일본 등 해외 쇼츠 트렌드까지 한눈에 파악. 글로벌 진출을 고민 중이라면 필수입니다.", tag: null, tagColor: null },
            { icon: "💎", bg: "rgba(168,85,247,0.1)", t: "히든 꿀통 자동 발굴", d: "아직 덜 알려졌지만 수익성이 높고 폭발적으로 성장 중인 채널을 자동으로 찾아냅니다.", tag: null, tagColor: null },
            { icon: "⚡", bg: "rgba(251,191,36,0.1)", t: "오늘의 Top 100 영상", d: "매일 업데이트되는 인기 쇼츠 영상 순위. 지금 가장 핫한 콘텐츠가 무엇인지 실시간으로 확인하세요.", tag: "인기 기능", tagColor: "#fbbf24" },
            { icon: "💰", bg: "rgba(34,197,94,0.1)", t: "채널 수익 분석", d: "채널의 예상 수익을 분석하고 수익성을 한눈에 파악. 어떤 채널이 실제로 돈을 벌고 있는지 확인하세요.", tag: "인기 기능", tagColor: "#22c55e" },
            { icon: "🔬", bg: "rgba(244,114,182,0.1)", t: "채널 비교 & 벤치마크", d: "내 채널과 경쟁 채널을 나란히 비교 분석. 어디서 차이가 나는지 한눈에 파악할 수 있습니다.", tag: null, tagColor: null },
            { icon: "📁", bg: "rgba(34,197,94,0.1)", t: "내 활동 & 메모", d: "즐겨찾기, 최근 본 채널, 메모 기능으로 관심 채널을 체계적으로 관리할 수 있습니다.", tag: null, tagColor: null },
          ].map((f) => (
            <div key={f.t} className="flex gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 sm:p-7">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: f.bg }}>{f.icon}</div>
              <div>
                <h3 className="text-base font-bold sm:text-lg">{f.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-zinc-500">{f.d}</p>
                {f.tag && <span className="mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold" style={{ background: `${f.tagColor}15`, color: f.tagColor! }}>{f.tag}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ██ 4 TABS ██ */}
      <section className="px-4 py-14 text-center sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Interface</p>
        <h2 className="mb-2 text-2xl font-black sm:text-3xl">직관적인 <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">4개 탭</span> 구성</h2>
        <p className="mx-auto mb-8 max-w-md text-sm text-zinc-500">필요한 정보에 빠르게 접근할 수 있도록 목적별로 분류했습니다.</p>

        <div className="mx-auto grid max-w-2xl gap-3 text-left sm:grid-cols-2">
          {[
            { icon: "📊", t: "대시보드", d: "전체 트렌드 요약, 오늘의 꿀통 채널, 추천 채널을 한 화면에서 확인" },
            { icon: "🔍", t: "채널 탐색", d: "카테고리별, 구독자 수, 채널 나이, 수익 등 다양한 필터로 채널 검색" },
            { icon: "🔥", t: "Top 100", d: "매일 갱신되는 인기 쇼츠 영상 순위. 최근 3일 이내 핫한 영상만 선별" },
            { icon: "📁", t: "내 활동", d: "즐겨찾기, 최근 본 채널, 메모, 벤치마크 등 내 분석 활동을 한곳에서 관리" },
          ].map((tab) => (
            <div key={tab.t} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h4 className="mb-1 flex items-center gap-2 text-sm font-bold"><span>{tab.icon}</span>{tab.t}</h4>
              <p className="text-xs leading-relaxed text-zinc-500">{tab.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ██ COMPARISON ██ */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Comparison</p>
        <h2 className="mb-8 text-2xl font-black sm:text-3xl">다른 분석 툴과 <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">비교</span>해보세요</h2>

        <div className="overflow-x-auto rounded-2xl border border-white/[0.06]">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="bg-white/[0.03] text-xs text-zinc-500">
                <th className="px-4 py-3 text-left font-semibold">항목</th>
                <th className="px-3 py-3 text-center font-semibold">A사</th>
                <th className="px-3 py-3 text-center font-semibold">B사</th>
                <th className="px-3 py-3 text-center font-semibold">C사</th>
                <th className="px-3 py-3 text-center font-semibold">D사</th>
                <th className="px-3 py-3 text-center font-semibold text-[#00e5a0]">YTFINDER</th>
              </tr>
            </thead>
            <tbody className="text-zinc-400">
              {[
                { label: "꿀통 지수 스코어링", a: false, b: false, c: false, d: false, yt: true },
                { label: "히든 꿀통 채널 발굴", a: false, b: false, c: false, d: false, yt: true },
                { label: "쇼츠 특화 분석", a: false, b: "일부", c: true, d: false, yt: true },
                { label: "채널 비교 분석", a: true, b: true, c: false, d: true, yt: true },
                { label: "글로벌 트렌드", a: true, b: false, c: true, d: true, yt: true },
                { label: "평생이용권", a: false, b: false, c: false, d: false, yt: true },
              ].map((row) => (
                <tr key={row.label} className="border-t border-white/[0.04]">
                  <td className="px-4 py-3 font-medium text-zinc-300">{row.label}</td>
                  {[row.a, row.b, row.c, row.d].map((v, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      {v === true ? <span className="font-bold text-[#00e5a0]">✓</span> : v === false ? <span className="text-zinc-700">✕</span> : <span className="text-zinc-500">{v}</span>}
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center bg-[#00e5a0]/[0.03]"><span className="font-bold text-[#00e5a0]">✓</span></td>
                </tr>
              ))}
              <tr className="border-t border-white/[0.04]">
                <td className="px-4 py-3 font-medium text-zinc-300">가격</td>
                <td className="px-3 py-3 text-center text-xs">월 99,950원~</td>
                <td className="px-3 py-3 text-center text-xs">월 59,800원~</td>
                <td className="px-3 py-3 text-center text-xs">월 12,900원~</td>
                <td className="px-3 py-3 text-center text-xs">월 29,000원~</td>
                <td className="px-3 py-3 text-center bg-[#00e5a0]/[0.03] text-sm font-bold text-[#00e5a0]">149,000원 (평생)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ██ INCLUDED ██ */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">What&apos;s included</p>
        <h2 className="mb-8 text-2xl font-black sm:text-3xl">평생이용권에 <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">포함된 것들</span></h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {["꿀통 지수 분석", "글로벌 트렌드", "Top 100 영상", "채널 비교 분석", "벤치마크 기능", "채널 상세 분석", "즐겨찾기 & 메모", "향후 업데이트 무료", "1:1 사용법 안내"].map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-sm font-medium text-zinc-300">
              <span className="text-[#00e5a0]">✓</span>{item}
            </div>
          ))}
        </div>
      </section>

      {/* ██ REVIEWS ██ */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Reviews</p>
        <h2 className="mb-8 text-2xl font-black sm:text-3xl">이용자 <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">후기</span></h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { text: "쇼츠 채널 운영하는데 어떤 콘텐츠가 뜨는지 한눈에 보여서 기획할 때 정말 유용해요. 꿀통 지수 진짜 신기합니다.", author: "구독자 5만 유튜버 A님" },
            { text: "vidIQ 쓰다가 갈아탔는데, 한국 쇼츠에 특화되어 있어서 훨씬 실용적이에요. 가격도 평생이용권이라 부담 없습니다.", author: "구독자 10만 유튜버 B님" },
            { text: "경쟁 채널 분석하느라 시간 엄청 쓰고 있었는데, 채널 비교 기능으로 한번에 해결됐습니다.", author: "구독자 3만 유튜버 C님" },
            { text: "히든 꿀통 기능으로 찾은 채널 레퍼런스가 진짜 도움됐어요. 남들 모르는 꿀통 채널을 먼저 발견하는 느낌!", author: "구독자 8만 유튜버 D님" },
          ].map((r) => (
            <div key={r.author} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <div className="mb-2 text-sm text-yellow-400">★★★★★</div>
              <p className="mb-3 text-sm leading-relaxed text-zinc-300">&ldquo;{r.text}&rdquo;</p>
              <p className="text-xs font-semibold text-zinc-600">{r.author}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ██ FAQ ██ */}
      <section className="px-4 py-14 sm:px-6 sm:py-20">
        <p className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">FAQ</p>
        <h2 className="mb-8 text-2xl font-black sm:text-3xl">자주 묻는 <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">질문</span></h2>
        <div className="flex flex-col gap-3">
          {[
            { q: "평생이용권이면 정말 평생 사용 가능한가요?", a: "네, 한 번 구매하시면 서비스가 유지되는 한 평생 사용 가능합니다. 추가 결제 없이 향후 업데이트도 무료로 제공됩니다." },
            { q: "별도 프로그램 설치가 필요한가요?", a: "아니요! 100% 웹 기반 서비스라 브라우저만 있으면 PC, 태블릿, 모바일 어디서든 사용 가능합니다." },
            { q: "YouTube API 키는 뭔가요? 어렵지 않나요?", a: "Google에서 무료로 발급받을 수 있는 키입니다. 구매 후 상세한 발급 가이드를 제공해드리며, 5분이면 완료됩니다." },
            { q: "환불이 가능한가요?", a: "크몽 정책에 따라 구매 후 일정 기간 내 환불이 가능합니다. 자세한 사항은 크몽 환불 정책을 참고해주세요." },
            { q: "초기 멤버 특가는 언제까지인가요?", a: "한정 수량이 소진되면 즉시 가격이 인상됩니다. 정확한 종료 시점은 별도 공지 없이 변경될 수 있으니 빠른 구매를 권장드립니다." },
          ].map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-200"><span className="text-zinc-500">Q.</span>{faq.q}</h4>
              <p className="pl-6 text-sm leading-relaxed text-zinc-500">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ██ CTA + 코드 입력 ██ */}
      <section className="relative px-4 py-16 text-center sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,229,160,0.06),transparent_60%)]" />

        <p className="relative mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">Get started</p>
        <h2 className="relative mb-2 text-2xl font-black sm:text-3xl">지금 시작하면 <span className="bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] bg-clip-text text-transparent">평생</span> 사용할 수 있습니다</h2>
        <p className="relative mx-auto mb-10 max-w-md text-sm text-zinc-500">정가 ₩299,000 → <b className="text-red-300">반값(50% OFF)</b> ₩149,000 — 이 가격은 다시 오지 않습니다.</p>

        {/* 코드 입력 카드 */}
        <div className="relative mx-auto w-full max-w-sm rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
          <div className="mb-1 flex items-center justify-center gap-2">
            <svg className="h-5 w-5 text-[#00e5a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <h3 className="text-lg font-bold text-white">액세스 코드 입력</h3>
          </div>
          <p className="mb-5 text-xs text-zinc-500">구매 후 발급받은 코드를 입력해주세요.</p>

          <input
            ref={codeRef}
            type="text"
            value={code}
            onChange={(e) => { setCode(e.target.value); setError(""); }}
            placeholder="YTFINDER-EARLY-XXX"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#00e5a0]/50 focus:ring-1 focus:ring-[#00e5a0]/20"
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />

          {error && (
            <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400">{error}</div>
          )}
          {success && (
            <div className="mt-3 rounded-lg border border-[#00e5a0]/20 bg-[#00e5a0]/10 px-3 py-2 text-xs font-medium text-[#00e5a0]">인증 완료! 잠시만 기다려주세요...</div>
          )}

          <button onClick={handleSubmit} disabled={!code.trim() || success} className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-4 py-3 text-sm font-bold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-40">
            인증하기
          </button>

          <div className="mt-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-zinc-500">
              아직 코드가 없으신가요?{" "}
              <a href="https://kmong.com" target="_blank" rel="noopener noreferrer" className="text-[#06b6d4] underline underline-offset-2 hover:text-[#00e5a0]">크몽에서 구매하기</a>
            </p>
          </div>
        </div>

        {/* 보장 */}
        <div className="relative mt-8 flex flex-wrap justify-center gap-4 sm:gap-8">
          {[
            { icon: "🔒", t: "안전한 크몽 결제" },
            { icon: "♾️", t: "평생 무료 업데이트" },
            { icon: "💬", t: "1:1 사용법 안내" },
          ].map((g) => (
            <div key={g.t} className="flex items-center gap-1.5 text-xs text-zinc-500 sm:text-sm">
              <span className="text-[#00e5a0]">{g.icon}</span>{g.t}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-600">
        &copy; 2026 시나브로. All rights reserved.
      </footer>
    </div>
    </div>
  );
}
