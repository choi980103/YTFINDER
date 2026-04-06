"use client";

import { use, useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import Sparkline from "@/components/Sparkline";
import Tooltip from "@/components/Tooltip";
import { Channel } from "@/data/mockChannels";
import {
  calculateScore,
  getScoreTier,
  getScoreLabel,
  getScoreColor,
  getScoreBg,
  getScoreGradient,
} from "@/lib/score";
import DetailChart from "@/components/DetailChart";
import { addRecentlyViewed } from "@/lib/recentlyViewed";
import { getChannelHistory, extractHistoryValues } from "@/lib/history";
import RadarChart from "@/components/RadarChart";

interface ChannelDetail {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  banner: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  createdAt: string;
  country: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  views: number;
  likes: number;
  duration: number;
  isShort: boolean;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + "B";
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + "M";
  if (num >= 1_000) return (num / 1_000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function daysSince(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 30) return `${days}일 전`;
  if (days < 365) return `${Math.floor(days / 30)}개월 전`;
  return `${Math.floor(days / 365)}년 전`;
}

function ShareButton({ channelName }: { channelName: string }) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const shareText = `${channelName} - 떡상 분석 결과 확인해봐!`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = shareUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      "_blank"
    );
  };

  const shareKakao = () => {
    // 카카오 SDK 없으면 클립보드 복사 후 카카오톡 열기 안내
    copyLink();
    alert("링크가 복사됐어! 카카오톡에 붙여넣기 해줘 🙂");
  };

  return (
    <div className="relative group/share">
      <button className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        공유
      </button>
      <div className="invisible absolute right-0 top-full z-50 mt-2 w-44 rounded-xl border border-white/10 bg-zinc-900 p-2 opacity-0 shadow-2xl transition-all group-hover/share:visible group-hover/share:opacity-100">
        <button
          onClick={copyLink}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? "✓ 복사됨!" : "🔗 링크 복사"}
        </button>
        <button
          onClick={shareTwitter}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          𝕏 트위터 공유
        </button>
        <button
          onClick={shareKakao}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          💬 카카오톡 공유
        </button>
      </div>
    </div>
  );
}

function HistoryCharts({ channelId }: { channelId: string }) {
  const history = getChannelHistory(channelId);

  if (history.length < 2) {
    return (
      <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
          <h3 className="text-sm font-semibold text-zinc-300">비율 변화 추이</h3>
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          아직 히스토리 데이터가 부족합니다. 메인 페이지에서 데이터를 여러 번 불러오면 시간에 따른 변화를 추적할 수 있어요!
        </p>
        {history.length === 1 && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-xs text-zinc-500">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00e5a0]" />
            첫 번째 스냅샷 기록됨: {new Date(history[0].timestamp).toLocaleString("ko-KR")}
          </div>
        )}
      </div>
    );
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}시`;
  };

  const subsData = extractHistoryValues(history, "subscribers").map((e) => ({
    label: formatDate(e.timestamp),
    value: e.value,
  }));

  const ratioData = extractHistoryValues(history, "viewToSubRatio").map((e) => ({
    label: formatDate(e.timestamp),
    value: e.value,
  }));

  const scoreData = extractHistoryValues(history, "score").map((e) => ({
    label: formatDate(e.timestamp),
    value: e.value,
  }));

  return (
    <div className="mb-8 space-y-4">
      {/* 구독자 추이 — 전체 너비 */}
      <DetailChart
        title="구독자 추이"
        subtitle="시간에 따른 구독자 수 변화"
        data={subsData}
        color="#06b6d4"
        height={200}
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <DetailChart
          title="조회/구독 비율 변화"
          subtitle="시간에 따른 비율 추이"
          data={ratioData}
          color="#00e5a0"
          height={180}
          valueFormatter={(v) => v.toFixed(1) + "%"}
        />
        <DetailChart
          title="떡상 지수 변화"
          subtitle="시간에 따른 종합 점수 추이"
          data={scoreData}
          color="#f59e0b"
          height={180}
          valueFormatter={(v) => v.toFixed(0) + "점"}
        />
      </div>
    </div>
  );
}

function findSimilarChannels(
  allChannels: Channel[],
  currentId: string,
  currentSubs: number
): Channel[] {
  return allChannels
    .filter((ch) => ch.id !== currentId)
    .map((ch) => ({
      ch,
      // 구독자 규모 유사도 (log scale)
      dist: Math.abs(Math.log10(ch.subscribers + 1) - Math.log10(currentSubs + 1)),
    }))
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 6)
    .map((x) => x.ch);
}

export default function ChannelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [channel, setChannel] = useState<ChannelDetail | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [memo, setMemo] = useState("");
  const [memoSaved, setMemoSaved] = useState(false);
  const [showShorts, setShowShorts] = useState<"all" | "shorts" | "long">("all");
  const [allChannels, setAllChannels] = useState<Channel[]>([]);

  const loadMemo = useCallback(() => {
    try {
      const memos = JSON.parse(localStorage.getItem("yt_memos") || "{}");
      setMemo(memos[id] || "");
    } catch { /* ignore */ }
  }, [id]);

  const saveMemo = useCallback(() => {
    try {
      const memos = JSON.parse(localStorage.getItem("yt_memos") || "{}");
      if (memo.trim()) {
        memos[id] = memo;
      } else {
        delete memos[id];
      }
      localStorage.setItem("yt_memos", JSON.stringify(memos));
      setMemoSaved(true);
      setTimeout(() => setMemoSaved(false), 2000);
    } catch { /* ignore */ }
  }, [id, memo]);

  useEffect(() => {
    loadMemo();

    // 비슷한 채널 추천용 데이터 로드
    try {
      const stored = localStorage.getItem("yt_all_channels");
      if (stored) setAllChannels(JSON.parse(stored));
    } catch { /* ignore */ }

    const apiKey = localStorage.getItem("yt_api_key") || "";
    if (!apiKey) {
      setError("API 키가 필요합니다. 메인 페이지에서 API 키를 연동해주세요.");
      setIsLoading(false);
      return;
    }

    async function fetchChannel() {
      try {
        const res = await fetch("/api/youtube/channel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apiKey, channelId: id }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "채널 정보를 불러올 수 없습니다");
          return;
        }
        setChannel(data.channel);
        setVideos(data.recentVideos || []);
        addRecentlyViewed({
          id: data.channel.id,
          name: data.channel.name,
          thumbnail: data.channel.thumbnail,
        });
      } catch {
        setError("네트워크 오류가 발생했습니다");
      } finally {
        setIsLoading(false);
      }
    }

    fetchChannel();
  }, [id, loadMemo]);

  const filteredVideos = videos.filter((v) => {
    if (showShorts === "shorts") return v.isShort;
    if (showShorts === "long") return !v.isShort;
    return true;
  });

  const shortsVideos = videos.filter((v) => v.isShort);
  const shortsAvgViews =
    shortsVideos.length > 0
      ? Math.round(shortsVideos.reduce((s, v) => s + v.views, 0) / shortsVideos.length)
      : 0;
  const viewTrend = shortsVideos.slice(0, 6).map((v) => v.views);

  // 떡상 지수 계산 (상세 페이지용)
  const channelForScore: Channel | null = channel
    ? {
        id: channel.id,
        name: channel.name,
        thumbnail: channel.thumbnail,
        subscribers: channel.subscribers,
        avgViews: shortsAvgViews,
        viewToSubRatio:
          channel.subscribers > 0
            ? parseFloat(((shortsAvgViews / channel.subscribers) * 100).toFixed(1))
            : 0,
        category: "쇼츠",
        recentVideos: shortsVideos.length,
        growthRate: 0, // 실제 데이터 없으므로 allChannels에서 찾기
        description: channel.description,
      }
    : null;

  // allChannels에서 현재 채널 데이터 찾기 (성장률 등)
  const matchedChannel = allChannels.find((ch) => ch.id === id);
  if (channelForScore && matchedChannel) {
    channelForScore.growthRate = matchedChannel.growthRate;
    channelForScore.viewToSubRatio = matchedChannel.viewToSubRatio;
    channelForScore.avgViews = matchedChannel.avgViews;
  }

  const score = channelForScore ? calculateScore(channelForScore) : 0;
  const tier = getScoreTier(score);

  const similarChannels = useMemo(() => {
    if (!channel || allChannels.length === 0) return [];
    return findSimilarChannels(allChannels, id, channel.subscribers);
  }, [allChannels, channel, id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] bg-grid">
        {/* Header skeleton */}
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
            <div className="h-4 w-16 rounded bg-white/10 skeleton-pulse" />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">
          {/* Profile skeleton */}
          <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div className="h-20 w-20 rounded-full bg-white/10 skeleton-pulse" />
            <div className="min-w-0 flex-1">
              <div className="h-7 w-48 rounded bg-white/10 skeleton-pulse" />
              <div className="mt-2 h-4 w-72 rounded bg-white/[0.07] skeleton-pulse" />
              <div className="mt-2 h-3 w-40 rounded bg-white/[0.07] skeleton-pulse" />
            </div>
            <div className="h-10 w-36 rounded-xl bg-white/10 skeleton-pulse" />
          </div>

          {/* Score hero skeleton */}
          <div className="mb-8 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/10 skeleton-pulse" />
                <div>
                  <div className="h-5 w-24 rounded bg-white/10 skeleton-pulse" />
                  <div className="mt-2 h-4 w-32 rounded bg-white/[0.07] skeleton-pulse" />
                </div>
              </div>
              <div className="flex flex-1 items-center gap-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i}>
                    <div className="h-3 w-12 rounded bg-white/[0.07] skeleton-pulse" />
                    <div className="mt-1 h-4 w-16 rounded bg-white/10 skeleton-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Stats cards skeleton */}
          <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-4">
                <div className="h-3 w-14 rounded bg-white/[0.07] skeleton-pulse" />
                <div className="mt-2 h-7 w-20 rounded bg-white/10 skeleton-pulse" />
              </div>
            ))}
          </div>

          {/* Chart skeleton */}
          <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="h-4 w-32 rounded bg-white/10 skeleton-pulse" />
            <div className="mt-4 h-[180px] w-full rounded-lg bg-white/[0.05] skeleton-pulse" />
          </div>

          {/* Videos skeleton */}
          <div className="mb-8">
            <div className="mb-4 h-5 w-24 rounded bg-white/10 skeleton-pulse" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
                  <div className="h-20 w-32 shrink-0 rounded-lg bg-white/10 skeleton-pulse sm:h-24 sm:w-36" />
                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-full rounded bg-white/10 skeleton-pulse" />
                    <div className="mt-1 h-4 w-3/4 rounded bg-white/[0.07] skeleton-pulse" />
                    <div className="mt-3 h-3 w-32 rounded bg-white/[0.07] skeleton-pulse" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] gap-4">
        <p className="text-red-400">{error}</p>
        <Link href="/" className="text-sm text-[#00e5a0] hover:underline">
          ← 메인으로 돌아가기
        </Link>
      </div>
    );
  }

  if (!channel) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] bg-grid text-zinc-100">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            목록으로
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Channel Profile */}
        <div className="mb-8 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {channel.thumbnail ? (
            <img
              src={channel.thumbnail}
              alt={channel.name}
              className="h-20 w-20 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#00e5a0] to-[#06b6d4] text-2xl font-bold text-white">
              {channel.name.charAt(0)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-white">{channel.name}</h1>
            <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
              {channel.description || "설명 없음"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
              {channel.country && <span>국가: {channel.country}</span>}
              <span>채널 개설: {formatDate(channel.createdAt)}</span>
              <span>({daysSince(channel.createdAt)})</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={`https://www.youtube.com/channel/${channel.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              YouTube에서 보기
            </a>
            <ShareButton channelName={channel.name} />
          </div>
        </div>

        {/* 떡상 지수 Hero */}
        {score > 0 && (
          <div className={`mb-8 rounded-2xl border p-6 ${getScoreBg(tier)}`}>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-8">
              <div className="flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${getScoreGradient(tier)}`}>
                  <span className="text-2xl font-black text-white">{score}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-white">떡상 지수</h2>
                    <Tooltip text="조회/구독 비율(50%) + 성장률(30%) + 활동량(20%) 종합 점수. S등급이면 떡상 임박!" />
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${getScoreBg(tier)} ${getScoreColor(tier)}`}>
                      {tier}등급
                    </span>
                    <span className={`text-sm font-semibold ${getScoreColor(tier)}`}>
                      {getScoreLabel(tier)}
                    </span>
                  </div>
                </div>
              </div>
              {/* Score breakdown */}
              <div className="flex flex-1 items-center gap-6 text-xs text-zinc-400">
                <div>
                  <div className="text-zinc-600">조회/구독</div>
                  <div className="font-bold text-zinc-300">
                    {channelForScore?.viewToSubRatio.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <div className="text-zinc-600">성장률</div>
                  <div className="font-bold text-emerald-400">
                    +{channelForScore?.growthRate || 0}%
                  </div>
                </div>
                <div>
                  <div className="text-zinc-600">쇼츠 수</div>
                  <div className="font-bold text-zinc-300">
                    {shortsVideos.length}개
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 레이더 차트 — 채널 역량 분석 */}
        {channelForScore && (
          <div className="mb-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
            <h2 className="mb-4 text-center text-sm font-semibold text-zinc-300">채널 역량 분석</h2>
            <RadarChart
              axes={(() => {
                const vsr = channelForScore.viewToSubRatio;
                const gr = channelForScore.growthRate;
                const activity = shortsVideos.length;
                const totalViews = shortsVideos.reduce((a, v) => a + v.views, 0);
                const totalLikes = shortsVideos.reduce((a, v) => a + v.likes, 0);
                const engRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
                // 각 지표를 0~100 스케일로 정규화
                return [
                  { label: "조회/구독", value: Math.min(vsr / 20, 100) },
                  { label: "성장률", value: Math.min(gr / 5, 100) },
                  { label: "활동량", value: Math.min(activity * 10, 100) },
                  { label: "참여율", value: Math.min(engRate * 15, 100) },
                  { label: "평균조회", value: Math.min(shortsAvgViews / 5000, 100) },
                ];
              })()}
            />
            <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-zinc-500">
              <span>조회/구독: {channelForScore.viewToSubRatio.toFixed(1)}%</span>
              <span>성장률: +{channelForScore.growthRate}%</span>
              <span>쇼츠: {shortsVideos.length}개</span>
              <span>평균조회: {formatNumber(shortsAvgViews)}</span>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">구독자</div>
            <div className="mt-1 text-2xl font-black text-white">{formatNumber(channel.subscribers)}</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">총 조회수</div>
            <div className="mt-1 text-2xl font-black text-[#06b6d4]">{formatNumber(channel.totalViews)}</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">영상 수</div>
            <div className="mt-1 text-2xl font-black text-white">{channel.videoCount}</div>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
            <div className="text-[10px] font-medium uppercase tracking-widest text-zinc-500">쇼츠 평균 조회</div>
            <div className="mt-1 text-2xl font-black text-[#00e5a0]">{formatNumber(shortsAvgViews)}</div>
            {viewTrend.length >= 2 && (
              <div className="mt-2">
                <Sparkline data={viewTrend} width={100} height={24} color="#00e5a0" />
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        {shortsVideos.length >= 2 && (
          <div className="mb-8">
            {/* 쇼츠 조회수 추이 */}
            <DetailChart
              title="쇼츠 조회수 추이"
              subtitle="최근 영상 기준 (과거→최신)"
              data={[...shortsVideos].slice(0, 10).reverse().map((v) => ({
                label: formatDate(v.publishedAt),
                value: v.views,
              }))}
              color="#00e5a0"
              height={200}
            />
          </div>
        )}

        {/* 히스토리 차트 (구독자 추이 + 비율 변화 + 떡상 지수) */}
        <div className="mb-2 flex items-center gap-1.5 text-[11px] text-zinc-600">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
          </svg>
          아래 추이 차트는 방문할 때마다 데이터가 기록되어, 시간이 지날수록 더 정확한 변화를 확인할 수 있습니다.
        </div>
        <HistoryCharts channelId={id} />

        {/* Memo */}
        <div className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">내 메모</h2>
            <button
              onClick={saveMemo}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                memoSaved
                  ? "bg-[#00e5a0]/20 text-[#00e5a0]"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {memoSaved ? "저장됨!" : "저장"}
            </button>
          </div>
          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="이 채널에 대한 메모를 남겨보세요..."
            rows={3}
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#00e5a0]/50 focus:ring-1 focus:ring-[#00e5a0]/20"
          />
        </div>

        {/* Recent Videos */}
        <div className="mb-8">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-bold text-white">최근 영상</h2>
            <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
              {(["all", "shorts", "long"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setShowShorts(type)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    showShorts === type
                      ? "bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] text-[#0a0a0f]"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {type === "all" ? "전체" : type === "shorts" ? "쇼츠" : "일반 영상"}
                </button>
              ))}
            </div>
          </div>

          {filteredVideos.length === 0 ? (
            <p className="py-10 text-center text-sm text-zinc-600">해당하는 영상이 없습니다</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filteredVideos.map((v) => (
                <a
                  key={v.id}
                  href={`https://www.youtube.com/watch?v=${v.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="relative shrink-0">
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
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-sm font-medium text-zinc-200 group-hover:text-white">
                      {v.title}
                    </h3>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500">
                      <span>조회수 {formatNumber(v.views)}</span>
                      <span>좋아요 {formatNumber(v.likes)}</span>
                      <span>{daysSince(v.publishedAt)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Similar Channels */}
        {similarChannels.length > 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">비슷한 채널</h2>
              <span className="text-xs text-zinc-600">구독자 규모가 비슷한 채널</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {similarChannels.map((ch) => {
                const s = calculateScore(ch);
                const t = getScoreTier(s);
                return (
                  <Link
                    key={ch.id}
                    href={`/channel/${ch.id}`}
                    className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 transition-all hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    {ch.thumbnail ? (
                      <img
                        src={ch.thumbnail}
                        alt={ch.name}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00e5a0] to-[#06b6d4] text-sm font-bold text-white">
                        {ch.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-zinc-200 group-hover:text-[#00e5a0] transition-colors">
                        {ch.name}
                      </h3>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <span>{formatNumber(ch.subscribers)} 구독</span>
                        <span className={`font-bold ${getScoreColor(t)}`}>
                          {t}·{s}점
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-zinc-600 group-hover:text-zinc-400">→</div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
