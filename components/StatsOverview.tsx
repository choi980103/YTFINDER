"use client";

import { Channel } from "@/data/mockChannels";

interface StatsOverviewProps {
  channels: Channel[];
}

export default function StatsOverview({ channels }: StatsOverviewProps) {
  const totalChannels = channels.length;
  const avgRatio =
    channels.reduce((sum, ch) => sum + ch.viewToSubRatio, 0) / totalChannels || 0;
  const explosiveCount = channels.filter(
    (ch) => ch.viewToSubRatio >= 1000
  ).length;
  const topGrowth = Math.max(...channels.map((ch) => ch.growthRate), 0);

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
      label: "폭발적 성장 채널",
      value: explosiveCount.toString(),
      suffix: "개",
      color: "text-[#00e5a0]",
    },
    {
      label: "최고 성장률",
      value: `+${topGrowth}`,
      suffix: "%",
      color: "text-amber-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
        >
          <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">
            {stat.label}
          </div>
          <div className={`mt-1 text-2xl font-black ${stat.color}`}>
            {stat.value}
            <span className="text-sm font-medium text-zinc-500">
              {stat.suffix}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
