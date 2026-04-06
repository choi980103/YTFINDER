"use client";

import Link from "next/link";
import { Channel } from "@/data/mockChannels";
import {
  calculateScore,
  getScoreTier,
  getScoreLabel,
  getScoreColor,
  getScoreGradient,
} from "@/lib/score";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

const MEDAL = ["🥇", "🥈", "🥉"];

interface TopSpotlightProps {
  channels: Channel[];
}

export default function TopSpotlight({ channels }: TopSpotlightProps) {
  const top3 = [...channels]
    .sort((a, b) => calculateScore(b) - calculateScore(a))
    .slice(0, 3);

  if (top3.length === 0) return null;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {top3.map((ch, i) => {
        const score = calculateScore(ch);
        const tier = getScoreTier(score);
        const isFirst = i === 0;

        return (
          <Link
            key={ch.id}
            href={`/channel/${ch.id}`}
            className={`group relative overflow-hidden rounded-2xl border p-4 transition-all hover:scale-[1.02] ${
              isFirst
                ? "border-[#00e5a0]/20 bg-[#00e5a0]/[0.03] sm:col-span-1"
                : "border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            {/* Medal + Rank */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-lg">{MEDAL[i]}</span>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${getScoreGradient(tier)}`}>
                <span className="text-xs font-black text-white">{score}</span>
              </div>
            </div>

            {/* Channel Info */}
            <div className="flex items-center gap-3">
              {ch.thumbnail ? (
                <img
                  src={ch.thumbnail}
                  alt={ch.name}
                  className="h-10 w-10 shrink-0 rounded-full object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getScoreGradient(tier)} text-sm font-bold text-white`}>
                  {ch.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <h3 className="truncate text-sm font-bold text-white group-hover:text-[#00e5a0] transition-colors">
                  {ch.name}
                </h3>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <span>{formatNumber(ch.subscribers)} 구독</span>
                  <span className={`font-bold ${getScoreColor(tier)}`}>
                    {tier} · {getScoreLabel(tier)}
                  </span>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="mt-3 flex items-center gap-3 text-xs">
              <div className="rounded-md bg-white/[0.04] px-2 py-1">
                <span className="text-zinc-500">비율 </span>
                <span className={`font-bold ${getScoreColor(tier)}`}>
                  {ch.viewToSubRatio.toFixed(0)}%
                </span>
              </div>
              <div className="rounded-md bg-white/[0.04] px-2 py-1">
                <span className="text-zinc-500">성장 </span>
                <span className="font-bold text-emerald-400">+{ch.growthRate}%</span>
              </div>
              <div className="rounded-md bg-white/[0.04] px-2 py-1">
                <span className="text-zinc-500">조회 </span>
                <span className="font-bold text-zinc-300">{formatNumber(ch.avgViews)}</span>
              </div>
            </div>

            {/* Glow for #1 */}
            {isFirst && (
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-[#00e5a0]/5 blur-3xl" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
