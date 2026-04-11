"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

interface TopVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  views: number;
  likes: number;
  comments: number;
  duration: number;
  isShort: boolean;
  publishedAt: string;
  categoryId: string;
}

type VideoFilter = "all" | "shorts" | "long";

interface Props {
  apiKey: string;
}

const CLIENT_CACHE_KEY = "yt_top100_cache_v1";
const CLIENT_CACHE_TTL = 1000 * 60 * 60 * 6; // 6시간

function formatNumber(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}억`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}천`;
  return n.toLocaleString();
}

function formatDuration(sec: number): string {
  if (sec < 60) return `${sec}초`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m < 60) return `${m}:${s.toString().padStart(2, "0")}`;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${h}:${mm.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function formatRelativeDate(iso: string): string {
  const now = new Date();
  const d = new Date(iso);
  const diffMs = now.getTime() - d.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  if (hours < 1) return "방금 전";
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}개월 전`;
  return `${Math.floor(months / 12)}년 전`;
}

export default function Top100Videos({ apiKey }: Props) {
  const [videos, setVideos] = useState<TopVideo[]>([]);
  const [filter, setFilter] = useState<VideoFilter>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const fetchTop100 = useCallback(
    async (key: string, forceRefresh = false) => {
      if (!key) return;

      if (!forceRefresh) {
        try {
          const cached = localStorage.getItem(CLIENT_CACHE_KEY);
          if (cached) {
            const { videos: cachedVideos, timestamp } = JSON.parse(cached);
            if (
              Date.now() - timestamp < CLIENT_CACHE_TTL &&
              cachedVideos.length > 0
            ) {
              setVideos(cachedVideos);
              setLastUpdated(timestamp);
              return;
            }
          }
        } catch {
          /* ignore */
        }
      }

      setIsLoading(true);
      setError("");

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetch("/api/youtube/top100", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey: key }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await res.json();

        if (!res.ok) {
          if (data.error?.includes("quota")) {
            setError(
              "API 할당량을 초과했습니다. 내일 오후 4시 이후에 다시 시도해주세요."
            );
          } else if (data.error?.includes("API key")) {
            setError("API 키가 유효하지 않습니다. 키를 다시 확인해주세요.");
          } else {
            setError(data.error || "Top 100 영상을 불러오지 못했습니다");
          }
          return;
        }

        if (data.videos && data.videos.length > 0) {
          setVideos(data.videos);
          const ts = Date.now();
          setLastUpdated(ts);
          try {
            localStorage.setItem(
              CLIENT_CACHE_KEY,
              JSON.stringify({ videos: data.videos, timestamp: ts })
            );
          } catch {
            /* quota exceeded */
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          setError("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
        } else {
          setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    if (apiKey) {
      fetchTop100(apiKey);
    }
  }, [apiKey, fetchTop100]);

  const filteredVideos = useMemo(() => {
    if (filter === "shorts") return videos.filter((v) => v.isShort);
    if (filter === "long") return videos.filter((v) => !v.isShort);
    return videos;
  }, [videos, filter]);

  if (!apiKey) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-12 text-center">
        <div className="mb-3 text-4xl">🔥</div>
        <h3 className="mb-2 text-lg font-semibold text-white">
          API 키를 먼저 연동해주세요
        </h3>
        <p className="text-sm text-zinc-500">
          상단의 &ldquo;API 키 설정&rdquo; 버튼을 눌러 YouTube API 키를 입력하면
          <br />
          실시간 Top 100 영상 데이터를 볼 수 있어요.
        </p>
      </div>
    );
  }

  const counts = {
    all: videos.length,
    shorts: videos.filter((v) => v.isShort).length,
    long: videos.filter((v) => !v.isShort).length,
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            <span className="gradient-text">🔥 오늘의 Top 100</span>
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            지금 한국에서 가장 뜨거운 YouTube 영상을 조회수 순으로
            {lastUpdated && (
              <span className="ml-2 text-zinc-600">
                · {new Date(lastUpdated).toLocaleTimeString("ko-KR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                기준
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchTop100(apiKey, true)}
          disabled={isLoading}
          className="rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isLoading ? "불러오는 중..." : "새로고침"}
        </button>
      </div>

      {/* 서브 필터 */}
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
        {([
          { id: "all", label: "전체", icon: "🎬" },
          { id: "shorts", label: "쇼츠", icon: "⚡" },
          { id: "long", label: "롱폼", icon: "🎞️" },
        ] as { id: VideoFilter; label: string; icon: string }[]).map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              filter === f.id
                ? "bg-white/10 text-white shadow-sm"
                : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
            }`}
          >
            <span>{f.icon}</span>
            <span>{f.label}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                filter === f.id
                  ? "bg-white/20 text-white"
                  : "bg-white/5 text-zinc-500"
              }`}
            >
              {counts[f.id]}
            </span>
          </button>
        ))}
      </div>

      {/* 에러 */}
      {error && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <span>{error}</span>
          <button
            onClick={() => {
              setError("");
              fetchTop100(apiKey, true);
            }}
            className="ml-4 shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/20"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 로딩 — 스켈레톤 */}
      {isLoading && videos.length === 0 && (
        <div>
          <div className="mb-4 flex items-center gap-2 text-sm text-[#06b6d4]">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            오늘의 Top 100을 불러오는 중...
          </div>
          <div className="flex flex-col gap-2">
            {[...Array(10)].map((_, i) => (
              <div
                key={i}
                style={{ animationDelay: `${i * 40}ms` }}
                className="card-animate flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 sm:gap-4"
              >
                {/* 순위 */}
                <div className="flex w-8 shrink-0 items-center justify-center sm:w-10">
                  <div className="h-6 w-5 rounded bg-white/10 skeleton-pulse" />
                </div>
                {/* 썸네일 */}
                <div className="h-16 w-28 shrink-0 rounded-lg bg-white/10 skeleton-pulse sm:h-20 sm:w-36" />
                {/* 제목 + 메타 */}
                <div className="min-w-0 flex-1">
                  <div className="h-4 w-full max-w-md rounded bg-white/10 skeleton-pulse" />
                  <div className="mt-2 h-3 w-3/4 max-w-sm rounded bg-white/[0.07] skeleton-pulse" />
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-3 w-16 rounded bg-white/[0.07] skeleton-pulse" />
                    <div className="h-3 w-12 rounded bg-white/[0.07] skeleton-pulse" />
                    <div className="h-3 w-14 rounded bg-white/[0.07] skeleton-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 비어있음 */}
      {!isLoading && filteredVideos.length === 0 && !error && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] py-16 text-center">
          <p className="text-sm text-zinc-500">
            해당 조건의 영상이 없습니다.
          </p>
        </div>
      )}

      {/* 영상 리스트 */}
      {filteredVideos.length > 0 && (
        <div className="flex flex-col gap-2">
          {filteredVideos.map((v, idx) => {
            const rank = videos.indexOf(v) + 1;
            return (
              <div
                key={v.id}
                className="group flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.05] sm:gap-4"
              >
                {/* 순위 */}
                <div className="flex w-8 shrink-0 items-center justify-center sm:w-10">
                  <span
                    className={`text-lg font-bold sm:text-xl ${
                      rank === 1
                        ? "text-amber-400"
                        : rank === 2
                        ? "text-zinc-300"
                        : rank === 3
                        ? "text-orange-400"
                        : "text-zinc-600"
                    }`}
                  >
                    {rank}
                  </span>
                </div>

                {/* 썸네일 */}
                <a
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative shrink-0 overflow-hidden rounded-lg"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={v.thumbnail}
                    alt={v.title}
                    className="h-16 w-28 object-cover transition-transform group-hover:scale-105 sm:h-20 sm:w-36"
                    loading={idx < 10 ? "eager" : "lazy"}
                  />
                  <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {formatDuration(v.duration)}
                  </span>
                  {v.isShort && (
                    <span className="absolute left-1 top-1 rounded bg-red-500/90 px-1.5 py-0.5 text-[9px] font-bold text-white">
                      SHORTS
                    </span>
                  )}
                </a>

                {/* 제목 + 메타 */}
                <div className="min-w-0 flex-1">
                  <a
                    href={`https://www.youtube.com/watch?v=${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="line-clamp-2 text-sm font-medium text-white transition-colors hover:text-[#00e5a0] sm:text-base"
                  >
                    {v.title}
                  </a>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-zinc-500">
                    <Link
                      href={`/channel/${v.channelId}`}
                      className="truncate font-medium text-zinc-400 transition-colors hover:text-[#06b6d4]"
                    >
                      {v.channelTitle}
                    </Link>
                    <span className="flex items-center gap-1 text-[#00e5a0]">
                      👁 {formatNumber(v.views)}
                    </span>
                    <span>❤️ {formatNumber(v.likes)}</span>
                    <span>{formatRelativeDate(v.publishedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 안내 */}
      {videos.length > 0 && (
        <p className="mt-6 text-center text-[11px] text-zinc-600">
          YouTube Data API v3의{" "}
          <code className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
            videos.list (chart=mostPopular)
          </code>
          로 수집 · 6시간마다 자동 갱신
        </p>
      )}
    </div>
  );
}
