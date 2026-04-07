"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Channel } from "@/data/mockChannels";
import Sparkline from "./Sparkline";
import Tooltip from "./Tooltip";
import { calculateScore, getScoreTier, getScoreLabel, getScoreColor, getScoreBg } from "@/lib/score";

function formatNumber(num: number): string {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function getRatioColor(ratio: number): string {
  if (ratio >= 1000) return "text-[#00e5a0]";
  if (ratio >= 500) return "text-[#06b6d4]";
  if (ratio >= 200) return "text-amber-400";
  return "text-zinc-400";
}

function getRatioBg(ratio: number): string {
  if (ratio >= 1000) return "bg-[#00e5a0]/10 border-[#00e5a0]/20";
  if (ratio >= 500) return "bg-[#06b6d4]/10 border-[#06b6d4]/20";
  if (ratio >= 200) return "bg-amber-400/10 border-amber-400/20";
  return "bg-zinc-400/10 border-zinc-400/20";
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

interface ChannelCardProps {
  channel: Channel;
  index: number;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  isTrending?: boolean;
}

export default function ChannelCard({
  channel,
  index,
  isFavorite,
  onToggleFavorite,
  isTrending,
}: ChannelCardProps) {
  const isExplosive = channel.viewToSubRatio >= 1000;
  const score = calculateScore(channel);
  const tier = getScoreTier(score);
  const router = useRouter();

  const handleCardClick = (e: React.MouseEvent) => {
    // 버튼, 링크, 인터랙티브 요소 클릭은 무시
    const target = e.target as HTMLElement;
    if (target.closest("a, button")) return;
    router.push(`/channel/${channel.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className={`channel-card group relative cursor-pointer overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-sm sm:p-5 ${
        isExplosive ? "border-[#00e5a0]/20" : ""
      }`}
    >
      {/* Trend Badge */}
      {isTrending && (
        <div className="absolute left-4 top-4 trend-badge rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-2.5 py-0.5 text-[10px] font-bold text-white">
          급상승
        </div>
      )}

      {/* Favorite Button — 넓은 클릭 영역 */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleFavorite(channel.id); }}
        className="absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-110 hover:bg-white/10 active:scale-95"
        title={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
      >
        <svg
          className={`h-5 w-5 transition-colors ${
            isFavorite
              ? "fill-amber-400 text-amber-400"
              : "fill-none text-zinc-600 hover:text-amber-400"
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

      {/* Explosive indicator */}
      {isExplosive && (
        <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-[#00e5a0]/5 blur-2xl" />
      )}

      {/* Channel Info Row */}
      <div className="mb-4 flex items-center gap-3">
        {/* Avatar — real thumbnail or initial */}
        {channel.thumbnail ? (
          <img
            src={channel.thumbnail}
            alt={channel.name}
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-white/10"
          />
        ) : (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getInitialColor(index)} text-sm font-bold text-white`}
          >
            {channel.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold text-white group-hover:text-[#00e5a0] transition-colors">
              {channel.name}
            </h3>
            {channel.monthlyUploads !== undefined && (
              <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                channel.monthlyUploads >= 10
                  ? "bg-[#00e5a0]/15 text-[#00e5a0]"
                  : channel.monthlyUploads >= 1
                  ? "bg-[#06b6d4]/15 text-[#06b6d4]"
                  : "bg-zinc-700/50 text-zinc-500"
              }`}>
                {channel.monthlyUploads > 0 ? `${channel.monthlyUploads}개/월` : "휴면"}
              </span>
            )}
          </div>
          <p className="truncate text-xs text-zinc-500">{channel.description}</p>
        </div>
      </div>

      {/* 떡상 지수 + Sparkline Row */}
      <div
        className={`mb-4 rounded-xl border p-3 ${getScoreBg(tier)}`}
      >
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="mb-0.5 flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
              떡상 지수
              <Tooltip text="조회/구독 비율(50%) + 성장률(30%) + 활동량(20%) 종합 점수" />
            </div>
            <div
              className={`text-3xl font-black tabular-nums ${getScoreColor(tier)} ${score >= 80 ? "ratio-glow" : ""}`}
            >
              {score}
            </div>
            <div
              className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${getScoreBg(tier)} ${getScoreColor(tier)}`}
            >
              {tier} · {getScoreLabel(tier)}
            </div>
          </div>
          {/* Sparkline */}
          {channel.viewTrend && channel.viewTrend.length >= 2 && (
            <div className="flex flex-col items-end gap-1">
              <span className="text-[9px] text-zinc-600">조회수 추이</span>
              <Sparkline
                data={channel.viewTrend}
                color={getSparklineColor(channel.viewToSubRatio)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-lg border p-2.5 ${getRatioBg(channel.viewToSubRatio)}`}>
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
            조회/구독 비율
            <Tooltip text="평균 조회수 / 구독자 수 × 100. 높을수록 알고리즘이 밀어주는 채널" />
          </div>
          <div className="mt-0.5 flex items-center gap-1.5">
            <span className={`text-sm font-black ${getRatioColor(channel.viewToSubRatio)}`}>{channel.viewToSubRatio.toFixed(1)}%</span>
            <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${getRatioBg(channel.viewToSubRatio)} ${getRatioColor(channel.viewToSubRatio)}`}>
              {getRatioLabel(channel.viewToSubRatio)}
            </span>
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            구독자
          </div>
          <div className="mt-0.5 text-sm font-bold text-zinc-200">
            {formatNumber(channel.subscribers)}
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2.5">
          <div className="text-[10px] uppercase tracking-wider text-zinc-400">
            평균 조회수
          </div>
          <div className="mt-0.5 text-sm font-bold text-zinc-200">
            {formatNumber(channel.avgViews)}
          </div>
        </div>
        <div className="rounded-lg bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
            성장률
            <Tooltip text="최근 구독자 증가 속도. 200% 이상이면 급성장 중" />
          </div>
          <div className="mt-0.5 text-sm font-bold text-emerald-400">
            +{channel.growthRate}%
          </div>
        </div>
      </div>

      {/* 참여율 바 */}
      {channel.engagementRate !== undefined && (
        <div className="mt-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-400">
              참여율
              <Tooltip text="(좋아요 + 댓글) ÷ 조회수. 높을수록 시청자 반응이 좋은 채널" />
            </div>
            <span className={`text-xs font-bold ${
              channel.engagementRate >= 5 ? "text-[#00e5a0]" :
              channel.engagementRate >= 3 ? "text-[#06b6d4]" :
              channel.engagementRate >= 1 ? "text-amber-400" : "text-zinc-500"
            }`}>
              {channel.engagementRate.toFixed(1)}%
            </span>
          </div>
          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className={`h-full rounded-full transition-all ${
                channel.engagementRate >= 5 ? "bg-[#00e5a0]" :
                channel.engagementRate >= 3 ? "bg-[#06b6d4]" :
                channel.engagementRate >= 1 ? "bg-amber-400" : "bg-zinc-600"
              }`}
              style={{ width: `${Math.min(channel.engagementRate * 10, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Category Tag + Links */}
      <div className="mt-3 flex items-center justify-between">
        <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[10px] font-medium text-zinc-400">
          {channel.category}
        </span>
        <div className="flex items-center gap-3">
          <a
            href={`https://www.youtube.com/channel/${channel.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-zinc-500 transition-colors hover:text-red-400"
          >
            YouTube
          </a>
          <Link
            href={`/channel/${channel.id}`}
            className="text-xs text-zinc-500 transition-colors hover:text-[#00e5a0]"
          >
            상세보기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
