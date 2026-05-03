"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Channel } from "@/data/mockChannels";
import Sparkline from "./Sparkline";
import { calculateScore, getScoreTier, getScoreColor, getScoreBg } from "@/lib/score";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function getRatioColor(ratio: number): string {
  if (ratio >= 1000) return "text-[#00e5a0]";
  if (ratio >= 500) return "text-[#06b6d4]";
  if (ratio >= 200) return "text-amber-400";
  return "text-zinc-300";
}

function getRatioLabel(ratio: number): string {
  if (ratio >= 1000) return "EXPLOSIVE";
  if (ratio >= 500) return "HOT";
  if (ratio >= 200) return "RISING";
  return "STEADY";
}

function getInitialColor(index: number): string {
  const colors = [
    "from-[#00e5a0] to-[#06b6d4]",
    "from-violet-500 to-purple-600",
    "from-orange-400 to-rose-500",
    "from-blue-400 to-indigo-600",
    "from-pink-500 to-rose-400",
    "from-amber-400 to-orange-500",
  ];
  return colors[index % colors.length];
}

function getSparklineColor(ratio: number): string {
  if (ratio >= 1000) return "#00e5a0";
  if (ratio >= 500) return "#06b6d4";
  if (ratio >= 200) return "#f59e0b";
  return "#a1a1aa";
}

interface ChannelListItemProps {
  channel: Channel;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isTrending?: boolean;
}

export default function ChannelListItem({
  channel,
  index,
  isFavorite,
  onToggleFavorite,
  isTrending,
}: ChannelListItemProps) {
  const router = useRouter();

  const handleRowClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    router.push(`/channel/${channel.id}`);
  };

  return (
    <div
      onClick={handleRowClick}
      className="card-animate group flex cursor-pointer items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-white/10 hover:bg-white/[0.04] sm:gap-4"
    >
      {/* Favorite */}
      <button
        onClick={() => onToggleFavorite(channel.id)}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all hover:scale-110 hover:bg-white/5 active:scale-95"
        title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      >
        <svg
          className={`h-4 w-4 ${
            isFavorite
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-zinc-500 hover:text-amber-400"
          }`}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
          />
        </svg>
      </button>

      {/* Avatar */}
      {channel.thumbnail ? (
        <img
          src={channel.thumbnail}
          alt={channel.name}
          className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/10"
        />
      ) : (
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getInitialColor(index)} text-xs font-bold text-white`}
        >
          {channel.name.charAt(0)}
        </div>
      )}

      {/* Name + Description */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#00e5a0] transition-colors">
            {channel.name}
          </h3>
          {isTrending && (
            <span className="shrink-0 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-2 py-0.5 text-[9px] font-bold text-white">
              급상승
            </span>
          )}
        </div>
        <p className="hidden truncate text-xs text-zinc-400 sm:block">
          {channel.description}
        </p>
      </div>

      {/* Stats — responsive columns */}
      <div className="hidden items-center gap-6 text-right sm:flex">
        <div className="w-14">
          <div className="text-[9px] uppercase text-zinc-500">떡상지수</div>
          {(() => {
            const s = calculateScore(channel);
            const t = getScoreTier(s);
            return (
              <div className="flex items-center justify-end gap-1">
                <span className={`text-sm font-black ${getScoreColor(t)}`}>{s}</span>
                <span className={`rounded px-1 py-0.5 text-[8px] font-bold ${getScoreBg(t)} ${getScoreColor(t)}`}>{t}</span>
              </div>
            );
          })()}
        </div>
        <div className="w-16">
          <div className="text-[9px] uppercase text-zinc-500">구독자</div>
          <div className="text-sm font-bold text-zinc-300">{formatNumber(channel.subscribers)}</div>
        </div>
        <div className="w-16">
          <div className="text-[9px] uppercase text-zinc-500">평균조회</div>
          <div className="text-sm font-bold text-zinc-300">{formatNumber(channel.avgViews)}</div>
        </div>
        <div className="w-20">
          <div className="text-[9px] uppercase text-zinc-500">비율</div>
          <div className={`text-sm font-black ${getRatioColor(channel.viewToSubRatio)}`}>
            {channel.viewToSubRatio.toFixed(1)}%
          </div>
        </div>
        <div className="w-14">
          <div className="text-[9px] uppercase text-zinc-500">성장률</div>
          <div className="text-sm font-bold text-emerald-400">+{channel.growthRate}%</div>
        </div>
      </div>

      {/* Mobile: compact ratio */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className={`text-sm font-black ${getRatioColor(channel.viewToSubRatio)}`}>
          {channel.viewToSubRatio.toFixed(0)}%
        </div>
      </div>

      {/* Sparkline */}
      {channel.viewTrend && channel.viewTrend.length >= 2 && (
        <div className="hidden lg:block">
          <Sparkline
            data={channel.viewTrend}
            width={64}
            height={24}
            color={getSparklineColor(channel.viewToSubRatio)}
          />
        </div>
      )}

      {/* Detail link */}
      <Link
        href={`/channel/${channel.id}`}
        className="shrink-0 text-xs text-zinc-500 transition-colors hover:text-[#00e5a0]"
      >
        →
      </Link>
    </div>
  );
}
