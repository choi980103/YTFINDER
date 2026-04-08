"use client";

import { useState } from "react";
import Link from "next/link";
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
function parseInput(input: string): { type: "id"; value: string } | { type: "handle"; value: string } | { type: "search"; value: string } {
  // /channel/UCxxxx 형식
  const channelMatch = input.match(/\/channel\/(UC[\w-]+)/);
  if (channelMatch) return { type: "id", value: channelMatch[1] };

  // 순수 UC 채널 ID
  if (input.startsWith("UC") && input.length >= 20) return { type: "id", value: input.trim() };

  // @handle 형식 (URL에 포함된 것도 추출)
  const handleMatch = input.match(/@([\w.-]+)/);
  if (handleMatch) return { type: "handle", value: handleMatch[1] };

  // 그 외 → 검색
  return { type: "search", value: input.trim() };
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

      // 채널 ID 또는 핸들 기반 → 서버 API로 분석 (3~4유닛)
      // 채널명 검색 → search API fallback (103유닛)
      let res: Response;

      if (parsed.type === "id") {
        res = await fetch("/api/youtube/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, channelId: parsed.value }),
        });
      } else if (parsed.type === "handle") {
        res = await fetch("/api/youtube/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, handle: parsed.value }),
        });
      } else {
        // 채널명 검색으로 ID 찾기
        let channelId: string | null = null;
        const searchRes = await fetch(`/api/youtube`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, query: parsed.value, category: undefined }),
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          if (searchData.channels && searchData.channels.length > 0) {
            channelId = searchData.channels[0].id;
          }
        }
        if (!channelId) {
          setError("채널을 찾을 수 없습니다. 채널 URL이나 정확한 이름을 입력해주세요.");
          return;
        }
        res = await fetch("/api/youtube/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, channelId }),
        });
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

      setResult({
        channel,
        honeyScore,
        honeyTier: getHoneyTier(honeyScore),
        monthlyRevenue: calculateMonthlyRevenue(channel),
        score,
        scoreTier: getScoreTier(score),
      });
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white">꿀채널인지 알아보기</h3>
        <p className="mt-1 text-xs text-zinc-500">
          채널 URL을 붙여넣으면 더 빠르고 정확해요 (채널명 검색도 가능)
        </p>
      </div>

      {/* 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLookup()}
          placeholder="채널 URL 또는 채널명 입력..."
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
    </div>
  );
}
