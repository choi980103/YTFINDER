"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Channel } from "@/data/mockChannels";
import { calculateScore, getScoreTier, getScoreColor, getScoreGradient } from "@/lib/score";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

// 날짜 기반 시드 — 같은 날이면 같은 결과
function getDailySeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

interface DailyDiscoveryProps {
  channels: Channel[];
}

export default function DailyDiscovery({ channels }: DailyDiscoveryProps) {
  const pick = useMemo(() => {
    if (channels.length === 0) return null;

    // 히든 젬 후보: 구독자 5만 이하 + 비율 200% 이상
    const gems = channels.filter(
      (ch) => ch.subscribers <= 50000 && ch.viewToSubRatio >= 200
    );

    // 히든 젬이 없으면 비율 상위 채널에서 선택
    const pool = gems.length >= 3 ? gems : [...channels].sort((a, b) => b.viewToSubRatio - a.viewToSubRatio).slice(0, Math.min(20, channels.length));

    const seed = getDailySeed();
    const index = Math.floor(seededRandom(seed) * pool.length);
    return pool[index];
  }, [channels]);

  if (!pick) return null;

  const score = calculateScore(pick);
  const tier = getScoreTier(score);

  return (
    <Link
      href={`/channel/${pick.id}`}
      className="group relative block overflow-hidden rounded-xl border border-amber-400/20 bg-white/[0.02] p-4 transition-all hover:border-amber-400/30 hover:bg-white/[0.04]"
    >
      {/* 상단: 라벨 */}
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg leading-none">💎</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400/80">오늘의 발견</span>
        <span className="rounded-full bg-amber-400/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-400">HIDDEN GEM</span>
      </div>

      {/* 채널 정보 */}
      <div className="flex items-center gap-3">
        {pick.thumbnail ? (
          <img
            src={pick.thumbnail}
            alt={pick.name}
            className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-amber-400/20"
          />
        ) : (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getScoreGradient(tier)} text-sm font-bold text-white`}>
            {pick.name.charAt(0)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
            {pick.name}
          </h3>
          <p className="truncate text-xs text-zinc-500">{pick.description}</p>
        </div>

        {/* Stats */}
        <div className="flex shrink-0 items-center gap-3 text-xs">
          <div className="text-center">
            <div className="text-[9px] text-zinc-600">구독자</div>
            <div className="font-bold text-zinc-300">{formatNumber(pick.subscribers)}</div>
          </div>
          <div className="hidden text-center sm:block">
            <div className="text-[9px] text-zinc-600">비율</div>
            <div className="font-bold text-amber-400">{pick.viewToSubRatio.toFixed(0)}%</div>
          </div>
          <div className="hidden text-center sm:block">
            <div className="text-[9px] text-zinc-600">떡상</div>
            <div className={`font-bold ${getScoreColor(tier)}`}>{score}점</div>
          </div>
        </div>

        {/* Arrow */}
        <svg className="h-4 w-4 shrink-0 text-zinc-600 transition-colors group-hover:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </div>

      {/* Glow */}
      <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-amber-400/5 blur-2xl" />
    </Link>
  );
}
