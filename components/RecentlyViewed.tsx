"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getRecentlyViewed, removeRecentlyViewed, RecentChannel } from "@/lib/recentlyViewed";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export default function RecentlyViewed() {
  const [channels, setChannels] = useState<RecentChannel[]>([]);

  useEffect(() => {
    setChannels(getRecentlyViewed());
  }, []);

  const handleRemove = useCallback((e: React.MouseEvent, channelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    removeRecentlyViewed(channelId);
    setChannels((prev) => prev.filter((c) => c.id !== channelId));
  }, []);

  if (channels.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-sm font-semibold text-zinc-300">최근 본 채널</h3>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
        {channels.map((ch) => (
          <Link
            key={ch.id}
            href={`/channel/${ch.id}`}
            className="group relative flex shrink-0 flex-col items-center gap-1.5 rounded-lg p-2 transition-all hover:bg-white/[0.04]"
          >
            {/* X 삭제 버튼 */}
            <button
              onClick={(e) => handleRemove(e, ch.id)}
              className="absolute -right-1 -top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
              title="삭제"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {ch.thumbnail ? (
              <img
                src={ch.thumbnail}
                alt={ch.name}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10 transition-all group-hover:ring-[#00e5a0]/40"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#00e5a0] to-[#06b6d4] text-xs font-bold text-white">
                {ch.name.charAt(0)}
              </div>
            )}
            <span className="max-w-[64px] truncate text-[10px] text-zinc-400 group-hover:text-zinc-300">
              {ch.name}
            </span>
            <span className="text-[9px] text-zinc-300">{timeAgo(ch.viewedAt)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
