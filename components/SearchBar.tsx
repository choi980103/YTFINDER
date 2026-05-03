"use client";

import { useState } from "react";

export type SubRange = "all" | "0-1만" | "1만-5만" | "5만-10만" | "10만+";

const subRanges: { value: SubRange; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "0-1만", label: "0 ~ 1만" },
  { value: "1만-5만", label: "1만 ~ 5만" },
  { value: "5만-10만", label: "5만 ~ 10만" },
  { value: "10만+", label: "10만 이상" },
];

export type ChannelAge = "all" | "1year";

export type RevenueRange = "all" | "50만+" | "150만+" | "300만+" | "1000만+";

const revenueRanges: { value: RevenueRange; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "50만+", label: "50만+" },
  { value: "150만+", label: "150만+" },
  { value: "300만+", label: "300만+" },
  { value: "1000만+", label: "1000만+" },
];

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  subRange: SubRange;
  onSubRangeChange: (range: SubRange) => void;
  channelAge: ChannelAge;
  onChannelAgeChange: (age: ChannelAge) => void;
  revenueRange: RevenueRange;
  onRevenueRangeChange: (range: RevenueRange) => void;
}

export default function SearchBar({
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  subRange,
  onSubRangeChange,
  channelAge,
  onChannelAgeChange,
  revenueRange,
  onRevenueRangeChange,
}: SearchBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (subRange !== "all" ? 1 : 0) +
    (channelAge !== "all" ? 1 : 0) +
    (revenueRange !== "all" ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search & Sort Row */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search Input */}
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <input
            type="text"
            placeholder="채널명으로 검색..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-12 pr-4 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:border-[#00e5a0]/50 focus:bg-white/[0.07] focus:ring-1 focus:ring-[#00e5a0]/20"
          />
        </div>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="cursor-pointer rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-sm text-zinc-200 outline-none transition-all hover:bg-zinc-800 focus:border-[#00e5a0]/50"
        >
          <option value="honey" className="bg-zinc-900 text-zinc-200">꿀통 지수순</option>
          <option value="score" className="bg-zinc-900 text-zinc-200">떡상 지수순</option>
          <option value="revenue" className="bg-zinc-900 text-zinc-200">월 예상 수익순</option>
          <option value="ratio" className="bg-zinc-900 text-zinc-200">조회수/구독자 비율순</option>
          <option value="growth" className="bg-zinc-900 text-zinc-200">성장률순</option>
          <option value="views" className="bg-zinc-900 text-zinc-200">평균 조회수순</option>
          <option value="subscribers" className="bg-zinc-900 text-zinc-200">구독자순</option>
        </select>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-300 transition-colors hover:bg-white/10 sm:hidden"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
          필터
          {activeFilterCount > 0 && (
            <span className="rounded-full bg-[#00e5a0]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#00e5a0]">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters — always visible on desktop, toggleable on mobile */}
      <div className={`space-y-3 ${filtersOpen ? "block" : "hidden"} sm:block`}>
        {/* Subscriber Range + Channel Age Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">구독자 수</span>
            {subRanges.map((r) => (
              <button
                key={r.value}
                onClick={() => onSubRangeChange(r.value)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                  subRange === r.value
                    ? "bg-gradient-to-r from-[#a78bfa] to-[#818cf8] text-white shadow-lg shadow-[#a78bfa]/20"
                    : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-zinc-200"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">채널 나이</span>
            <button
              onClick={() => onChannelAgeChange(channelAge === "all" ? "1year" : "all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                channelAge === "1year"
                  ? "bg-gradient-to-r from-[#f472b6] to-[#fb923c] text-white shadow-lg shadow-[#f472b6]/20"
                  : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              최근 1년 이내 생성
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400">월 예상 수익</span>
          {revenueRanges.map((r) => (
            <button
              key={r.value}
              onClick={() => onRevenueRangeChange(r.value)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                revenueRange === r.value
                  ? "bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] text-[#0a0a0f] shadow-lg shadow-[#00e5a0]/20"
                  : "border border-white/10 bg-white/5 text-zinc-300 hover:border-white/20 hover:text-zinc-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
