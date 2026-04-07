"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBenchmarks, removeBenchmark, type BenchmarkVideo } from "@/lib/benchmark";

function formatNumber(n: number): string {
  if (n >= 100_000_000) return (n / 100_000_000).toFixed(1) + "억";
  if (n >= 10_000) return (n / 10_000).toFixed(1) + "만";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "천";
  return n.toString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BenchmarkList() {
  const [benchmarks, setBenchmarks] = useState<BenchmarkVideo[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setBenchmarks(getBenchmarks());
  }, []);

  if (benchmarks.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4 text-violet-400" fill="currentColor" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
        </svg>
        벤치마킹 영상
        <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
          {benchmarks.length}
        </span>
        <svg className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {benchmarks.map((v) => (
            <div
              key={v.videoId}
              className="group relative flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <a
                href={`https://www.youtube.com/watch?v=${v.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="relative shrink-0"
              >
                {v.thumbnail ? (
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="h-20 w-32 rounded-lg object-cover sm:h-24 sm:w-36"
                  />
                ) : (
                  <div className="flex h-20 w-32 items-center justify-center rounded-lg bg-white/5 sm:h-24 sm:w-36">
                    <svg className="h-6 w-6 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
                    </svg>
                  </div>
                )}
                {v.isShort && (
                  <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                    SHORT
                  </span>
                )}
                <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-mono text-white">
                  {formatDuration(v.duration)}
                </span>
              </a>
              <div className="min-w-0 flex-1">
                <a
                  href={`https://www.youtube.com/watch?v=${v.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <h3 className="line-clamp-2 text-sm font-medium text-zinc-200 hover:text-white">
                    {v.title}
                  </h3>
                </a>
                <Link
                  href={`/channel/${v.channelId}`}
                  className="mt-1 block text-xs text-[#00e5a0] hover:underline"
                >
                  {v.channelName}
                </Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                  <span>조회수 {formatNumber(v.views)}</span>
                  <span>좋아요 {formatNumber(v.likes)}</span>
                  <span>{v.addedAt} 추가</span>
                </div>
              </div>
              <button
                onClick={() => {
                  const updated = removeBenchmark(v.videoId);
                  setBenchmarks(updated);
                }}
                className="absolute right-2 top-2 rounded-md bg-white/5 p-1 text-zinc-600 opacity-0 transition-all hover:bg-red-500/20 hover:text-red-400 group-hover:opacity-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
