"use client";

import { Channel } from "@/data/mockChannels";
import { calculateHoneyScore, calculateMonthlyRevenue } from "@/lib/score";

interface StatsOverviewProps {
  channels: Channel[];
}

function formatRevenue(num: number): string {
  if (num >= 10000000) return (num / 10000000).toFixed(1) + "천만";
  if (num >= 10000) return Math.round(num / 10000) + "만";
  return num.toLocaleString();
}

export default function StatsOverview({ channels }: StatsOverviewProps) {
  const totalChannels = channels.length;
  const avgRatio =
    channels.reduce((sum, ch) => sum + ch.viewToSubRatio, 0) / totalChannels || 0;
  const honeyChannels = channels.filter((ch) => calculateHoneyScore(ch) >= 60).length;
  const topRevenue = channels.length > 0
    ? Math.max(...channels.map((ch) => calculateMonthlyRevenue(ch)))
    : 0;

  const stats = [
    {
      label: "분석 채널",
      value: totalChannels.toString(),
      suffix: "개",
      color: "text-white",
    },
    {
      label: "평균 조회/구독 비율",
      value: avgRatio.toFixed(1),
      suffix: "%",
      color: "text-[#06b6d4]",
    },
    {
      label: "꿀통 채널",
      value: honeyChannels.toString(),
      suffix: "개",
      color: "text-yellow-400",
    },
    {
      label: "최고 월 수익",
      value: formatRevenue(topRevenue),
      suffix: "원",
      color: "text-[#00e5a0]",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-300">
            {stat.label}
          </div>
          <div className={`mt-1 text-2xl font-black ${stat.color}`}>
            {stat.value}
            <span className="text-sm font-medium text-zinc-400">
              {stat.suffix}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
