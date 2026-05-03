"use client";

import { useState } from "react";
import Link from "next/link";
import { Channel } from "@/data/mockChannels";
import { calculateScore, getScoreTier, getScoreColor, getScoreBg } from "@/lib/score";

function formatNumber(n: number): string {
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + "억";
  if (n >= 10_000) return (n / 10_000).toFixed(1) + "만";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "천";
  return n.toString();
}

interface ChannelCompareProps {
  channels: Channel[];
}

export default function ChannelCompare({ channels }: ChannelCompareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev;
      return [...prev, id];
    });
  };

  const selectedChannels = channels.filter((ch) => selected.includes(ch.id));

  const filteredChannels = search
    ? channels.filter((ch) => ch.name.toLowerCase().includes(search.toLowerCase()))
    : channels.slice(0, 20);

  // 비교 항목에서 최고값 찾기
  const getMax = (key: keyof Channel) => {
    if (selectedChannels.length === 0) return 0;
    return Math.max(...selectedChannels.map((ch) => Number(ch[key]) || 0));
  };

  const estimateRevenue = (avgViews: number) => Math.round((avgViews / 2) * 0.3);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4 text-[#06b6d4]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
        </svg>
        채널 비교
        {selected.length > 0 && (
          <span className="rounded-full bg-[#06b6d4]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#06b6d4]">
            {selected.length}
          </span>
        )}
        <svg className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3">
          {/* 채널 선택 */}
          <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs text-zinc-300">비교할 채널 선택 (최대 3개)</span>
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-[11px] text-zinc-400 hover:text-zinc-300">
                  초기화
                </button>
              )}
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="채널 이름 검색..."
              className="mb-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-[#06b6d4]/50"
            />
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {filteredChannels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => toggleSelect(ch.id)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                    selected.includes(ch.id)
                      ? "bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30"
                      : "bg-white/5 text-zinc-300 hover:bg-white/10 border border-transparent"
                  } ${!selected.includes(ch.id) && selected.length >= 3 ? "opacity-30 cursor-not-allowed" : ""}`}
                  disabled={!selected.includes(ch.id) && selected.length >= 3}
                >
                  {ch.name}
                </button>
              ))}
            </div>
          </div>

          {/* 비교 테이블 */}
          {selectedChannels.length >= 2 && (
            <div className="overflow-x-auto rounded-xl border border-white/[0.06] bg-white/[0.02]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-widest text-zinc-400">항목</th>
                    {selectedChannels.map((ch) => (
                      <th key={ch.id} className="px-4 py-3 text-center">
                        <Link href={`/channel/${ch.id}`} className="text-xs font-semibold text-zinc-300 hover:text-[#00e5a0]">
                          {ch.name.length > 10 ? ch.name.slice(0, 10) + "…" : ch.name}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "구독자", key: "subscribers" as const, format: formatNumber },
                    { label: "평균 조회수", key: "avgViews" as const, format: formatNumber },
                    { label: "조회/구독 비율", key: "viewToSubRatio" as const, format: (v: number) => v.toFixed(1) + "%" },
                    { label: "성장률", key: "growthRate" as const, format: (v: number) => "+" + v + "%" },
                  ].map((row) => {
                    const maxVal = getMax(row.key);
                    return (
                      <tr key={row.key} className="border-b border-white/[0.04]">
                        <td className="px-4 py-2.5 text-xs text-zinc-300">{row.label}</td>
                        {selectedChannels.map((ch) => {
                          const val = Number(ch[row.key]) || 0;
                          const isBest = val === maxVal && selectedChannels.filter((c) => Number(c[row.key]) === maxVal).length === 1;
                          return (
                            <td key={ch.id} className={`px-4 py-2.5 text-center text-xs font-bold ${isBest ? "text-[#00e5a0]" : "text-zinc-300"}`}>
                              {row.format(val)}
                              {isBest && <span className="ml-1 text-[9px]">👑</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                  {/* 떡상 지수 */}
                  <tr className="border-b border-white/[0.04]">
                    <td className="px-4 py-2.5 text-xs text-zinc-300">떡상 지수</td>
                    {selectedChannels.map((ch) => {
                      const s = calculateScore(ch);
                      const t = getScoreTier(s);
                      const scores = selectedChannels.map((c) => calculateScore(c));
                      const maxScore = Math.max(...scores);
                      const isBest = s === maxScore && scores.filter((x) => x === maxScore).length === 1;
                      return (
                        <td key={ch.id} className="px-4 py-2.5 text-center">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${getScoreBg(t)} ${getScoreColor(t)}`}>
                            {s}점 · {t}
                          </span>
                          {isBest && <span className="ml-1 text-[9px]">👑</span>}
                        </td>
                      );
                    })}
                  </tr>
                  {/* 예상 영상당 수익 */}
                  <tr>
                    <td className="px-4 py-2.5 text-xs text-zinc-300">예상 영상당 수익</td>
                    {selectedChannels.map((ch) => {
                      const rev = estimateRevenue(ch.avgViews);
                      const revenues = selectedChannels.map((c) => estimateRevenue(c.avgViews));
                      const maxRev = Math.max(...revenues);
                      const isBest = rev === maxRev && revenues.filter((r) => r === maxRev).length === 1;
                      return (
                        <td key={ch.id} className={`px-4 py-2.5 text-center text-xs font-bold ${isBest ? "text-[#00e5a0]" : "text-zinc-300"}`}>
                          {rev.toLocaleString()}원
                          {isBest && <span className="ml-1 text-[9px]">👑</span>}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {selectedChannels.length < 2 && selectedChannels.length > 0 && (
            <p className="text-xs text-zinc-400">채널을 1개 더 선택하면 비교할 수 있어요</p>
          )}
        </div>
      )}
    </div>
  );
}
