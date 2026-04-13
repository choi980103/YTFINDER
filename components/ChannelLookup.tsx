"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  calculateHoneyScore,
  calculateMonthlyRevenue,
  getHoneyTier,
  getHoneyLabel,
  getHoneyColor,
  getHoneyBg,
  calculateScore,
  getScoreTier,
  getScoreLabel,
  getScoreColor,
} from "@/lib/score";
import { Channel } from "@/data/mockChannels";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function formatRevenue(num: number): string {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + "천만";
  if (num >= 10000) return Math.round(num / 10000) + "만";
  return num.toLocaleString();
}

/** YouTube URL에서 채널 ID 또는 @핸들 추출 */
function parseInput(raw: string): { type: "id"; value: string } | { type: "handle"; value: string } | { type: "invalid"; value: string } {
  // 퍼센트 인코딩 디코딩 (한글 핸들 지원)
  let input = raw;
  try { input = decodeURIComponent(raw); } catch { /* ignore */ }

  // /channel/UCxxxx 형식
  const channelMatch = input.match(/\/channel\/(UC[\w-]+)/);
  if (channelMatch) return { type: "id", value: channelMatch[1] };

  // 순수 UC 채널 ID
  if (input.startsWith("UC") && input.length >= 20) return { type: "id", value: input.trim() };

  // @handle 형식 (한글, 영문, 숫자, 하이픈, 점 등 지원)
  const handleMatch = input.match(/@([^/?&\s]+)/);
  if (handleMatch) return { type: "handle", value: handleMatch[1] };

  // 그 외 → 지원하지 않는 형식
  return { type: "invalid", value: input.trim() };
}

const LOOKUP_HISTORY_KEY = "yt_lookup_history";
const MAX_HISTORY = 10;

interface LookupHistoryItem {
  id: string;
  name: string;
  thumbnail: string;
  honeyScore: number;
  honeyTier: string;
  monthlyRevenue: number;
  searchedAt: string;
}

interface ChannelLookupProps {
  apiKey: string;
}

interface LookupResult {
  channel: Channel;
  honeyScore: number;
  honeyTier: ReturnType<typeof getHoneyTier>;
  monthlyRevenue: number;
  score: number;
  scoreTier: ReturnType<typeof getScoreTier>;
}

export default function ChannelLookup({ apiKey }: ChannelLookupProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [history, setHistory] = useState<LookupHistoryItem[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOOKUP_HISTORY_KEY);
      if (saved) setHistory(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  function saveToHistory(item: LookupHistoryItem) {
    setHistory((prev) => {
      const filtered = prev.filter((h) => h.id !== item.id);
      const next = [item, ...filtered].slice(0, MAX_HISTORY);
      localStorage.setItem(LOOKUP_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  function removeFromHistory(id: string) {
    setHistory((prev) => {
      const next = prev.filter((h) => h.id !== id);
      localStorage.setItem(LOOKUP_HISTORY_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function handleLookup() {
    const trimmed = input.trim();
    if (!trimmed) return;

    if (!apiKey) {
      setError("API 키를 먼저 연동해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const parsed = parseInput(trimmed);

      let res: Response;

      if (parsed.type === "id") {
        res = await fetchWithAuth("/api/youtube/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, channelId: parsed.value }),
        });
      } else if (parsed.type === "handle") {
        res = await fetchWithAuth("/api/youtube/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, handle: parsed.value }),
        });
      } else {
        setError("채널 URL 또는 @핸들을 입력해주세요. (예: youtube.com/@채널명)");
        setIsLoading(false);
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "채널 분석에 실패했습니다.");
        return;
      }

      const data = await res.json();
      const { channel: chData, recentVideos } = data;

      // 쇼츠만 필터
      const shorts = recentVideos.filter((v: { isShort: boolean }) => v.isShort);
      const avgViews = shorts.length > 0
        ? Math.round(shorts.reduce((s: number, v: { views: number }) => s + v.views, 0) / shorts.length)
        : 0;
      const viewToSubRatio = chData.subscribers > 0
        ? parseFloat(((avgViews / chData.subscribers) * 100).toFixed(1))
        : 0;

      // 30일 이내 업로드 수
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const monthlyUploads = shorts.filter(
        (v: { publishedAt: string }) => new Date(v.publishedAt) >= thirtyDaysAgo
      ).length;

      const channel: Channel = {
        id: chData.id,
        name: chData.name,
        thumbnail: chData.thumbnail,
        subscribers: chData.subscribers,
        avgViews,
        viewToSubRatio,
        category: "쇼츠",
        recentVideos: shorts.length,
        growthRate: 0,
        description: chData.description?.slice(0, 80) || "",
        monthlyUploads,
      };

      const honeyScore = calculateHoneyScore(channel);
      const score = calculateScore(channel);

      const honeyTier = getHoneyTier(honeyScore);
      const monthlyRevenue = calculateMonthlyRevenue(channel);

      setResult({
        channel,
        honeyScore,
        honeyTier,
        monthlyRevenue,
        score,
        scoreTier: getScoreTier(score),
      });

      saveToHistory({
        id: channel.id,
        name: channel.name,
        thumbnail: channel.thumbnail,
        honeyScore,
        honeyTier,
        monthlyRevenue,
        searchedAt: new Date().toISOString(),
      });
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-400/20 bg-gradient-to-br from-yellow-400/[0.05] to-amber-500/[0.03] p-5 sm:p-6">
      {/* 배경 글로우 */}
      <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-yellow-400/10 blur-3xl" />
      <div className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-amber-500/10 blur-3xl" />

      <div className="relative mb-4">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-lg">🍯</span>
          <h3 className="text-base font-bold text-white sm:text-lg">꿀채널인지 알아보기</h3>
        </div>
        <p className="text-xs text-zinc-400">
          유튜브 채널 URL 또는 @핸들을 붙여넣어 주세요
        </p>
      </div>

      {/* 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          placeholder="youtube.com/@채널명 또는 @핸들 입력..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-yellow-400/50 focus:ring-1 focus:ring-yellow-400/20"
        />
        <button
          onClick={handleLookup}
          disabled={isLoading || !input.trim()}
          className="shrink-0 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-5 py-2.5 text-sm font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              분석 중
            </span>
          ) : (
            "분석하기"
          )}
        </button>
      </div>

      {/* 에러 */}
      {error && (
        <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* 결과 */}
      {result && (
        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          {/* 채널 정보 */}
          <div className="mb-4 flex items-center gap-3">
            {result.channel.thumbnail ? (
              <img
                src={result.channel.thumbnail}
                alt={result.channel.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-lg font-bold text-white">
                {result.channel.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-bold text-white">{result.channel.name}</h4>
              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span>{formatNumber(result.channel.subscribers)} 구독자</span>
                <span>평균 조회수 {formatNumber(result.channel.avgViews)}</span>
              </div>
            </div>
            <Link
              href={`/channel/${result.channel.id}`}
              className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/10"
            >
              상세보기
            </Link>
          </div>

          {/* 꿀통 지수 + 떡상 지수 */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl border p-3 text-center ${getHoneyBg(result.honeyTier)}`}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">꿀통 지수</div>
              <div className={`text-3xl font-black ${getHoneyColor(result.honeyTier)}`}>{result.honeyScore}</div>
              <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getHoneyBg(result.honeyTier)} ${getHoneyColor(result.honeyTier)}`}>
                {result.honeyTier} · {getHoneyLabel(result.honeyTier)}
              </div>
            </div>
            <div className={`rounded-xl border p-3 text-center ${
              result.scoreTier === "S" ? "bg-[#00e5a0]/10 border-[#00e5a0]/30" :
              result.scoreTier === "A" ? "bg-[#06b6d4]/10 border-[#06b6d4]/30" :
              "bg-zinc-400/10 border-zinc-400/30"
            }`}>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">떡상 지수</div>
              <div className={`text-3xl font-black ${getScoreColor(result.scoreTier)}`}>{result.score}</div>
              <div className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getScoreColor(result.scoreTier)}`}>
                {result.scoreTier} · {getScoreLabel(result.scoreTier)}
              </div>
            </div>
          </div>

          {/* 상세 스탯 */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/[0.04] p-2.5 text-center">
              <div className="text-[10px] text-zinc-500">월 예상 수익</div>
              <div className={`mt-0.5 text-sm font-bold ${getHoneyColor(result.honeyTier)}`}>
                {formatRevenue(result.monthlyRevenue)}원
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2.5 text-center">
              <div className="text-[10px] text-zinc-500">조회/구독 비율</div>
              <div className="mt-0.5 text-sm font-bold text-[#06b6d4]">
                {result.channel.viewToSubRatio.toFixed(1)}%
              </div>
            </div>
            <div className="rounded-lg bg-white/[0.04] p-2.5 text-center">
              <div className="text-[10px] text-zinc-500">월 업로드</div>
              <div className="mt-0.5 text-sm font-bold text-zinc-300">
                {result.channel.monthlyUploads ?? 0}개
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 검색 기록 */}
      {history.length > 0 && (
        <div className="relative mt-5 border-t border-white/[0.06] pt-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">최근 검색</span>
            <button
              onClick={() => {
                setHistory([]);
                localStorage.removeItem(LOOKUP_HISTORY_KEY);
              }}
              className="text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
            >
              전체 삭제
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {history.map((item) => (
              <Link
                key={item.id}
                href={`/channel/${item.id}`}
                className="group relative flex shrink-0 items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-all hover:border-yellow-400/20 hover:bg-white/[0.04]"
              >
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeFromHistory(item.id); }}
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-zinc-500 opacity-0 transition-all hover:bg-zinc-700 hover:text-zinc-300 group-hover:opacity-100"
                >
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {item.thumbnail ? (
                  <img src={item.thumbnail} alt={item.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-white/10" />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-xs font-bold text-white">
                    {item.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium text-zinc-300 max-w-[100px]">{item.name}</div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold ${getHoneyColor(getHoneyTier(item.honeyScore))}`}>
                      {item.honeyTier} {item.honeyScore}
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      {formatRevenue(item.monthlyRevenue)}원
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
