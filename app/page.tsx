"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import SearchBar, { type SubRange, type ChannelAge } from "@/components/SearchBar";
import ChannelGrid from "@/components/ChannelGrid";
import { calculateScore } from "@/lib/score";
import StatsOverview from "@/components/StatsOverview";
import ApiKeyModal from "@/components/ApiKeyModal";
import ScrollToTop from "@/components/ScrollToTop";
import TopSpotlight from "@/components/TopSpotlight";
import { SkeletonGrid } from "@/components/SkeletonCard";
import { mockChannels, Channel } from "@/data/mockChannels";
import RecentlyViewed from "@/components/RecentlyViewed";
import DailyDiscovery from "@/components/DailyDiscovery";
import { saveChannelSnapshots } from "@/lib/history";
import LandingHero from "@/components/LandingHero";

type RegionTab = "kr" | "us" | "jp";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState("ratio");
  const [subRange, setSubRange] = useState<SubRange>("all");
  const [channelAge, setChannelAge] = useState<ChannelAge>("all");
  const [regionTab, setRegionTab] = useState<RegionTab>("kr");

  // 즐겨찾기 (순서 보존을 위해 배열도 관리)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteOrder, setFavoriteOrder] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showHiddenGems, setShowHiddenGems] = useState(false);
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "전체" ||
    subRange !== "all" ||
    channelAge !== "all" ||
    showFavoritesOnly ||
    showHiddenGems ||
    showTrendingOnly;

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("전체");
    setSortBy("ratio");
    setSubRange("all");
    setChannelAge("all");
    setShowFavoritesOnly(false);
    setShowHiddenGems(false);
    setShowTrendingOnly(false);
  }, []);

  // API 상태
  const [apiKey, setApiKey] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [liveChannels, setLiveChannels] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dataSource, setDataSource] = useState<"mock" | "live">("mock");
  const [isReady, setIsReady] = useState(false); // 초기 마운트 완료 여부
  const [showLanding, setShowLanding] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("yt_api_key") || "";
    const hasVisited = localStorage.getItem("yt_has_visited");
    if (stored) {
      setApiKey(stored);
      fetchShortsChannels(stored);
    } else if (!hasVisited) {
      // 첫 방문 + API 키 없음 → 랜딩 페이지
      setShowLanding(true);
      setIsReady(true);
    } else {
      // 재방문이지만 API 키 없음 → 샘플 데이터
      setTimeout(() => setIsReady(true), 800);
    }
    const savedFavs = localStorage.getItem("yt_favorites");
    if (savedFavs) {
      try {
        const arr = JSON.parse(savedFavs);
        setFavorites(new Set(arr));
        setFavoriteOrder(arr);
      } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setFavoriteOrder((o) => {
          const newO = o.filter((x) => x !== id);
          localStorage.setItem("yt_favorites", JSON.stringify(newO));
          return newO;
        });
      } else {
        next.add(id);
        setFavoriteOrder((o) => {
          const newO = [...o, id];
          localStorage.setItem("yt_favorites", JSON.stringify(newO));
          return newO;
        });
      }
      return next;
    });
  }, []);

  const reorderFavorites = useCallback((fromIndex: number, toIndex: number) => {
    setFavoriteOrder((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      localStorage.setItem("yt_favorites", JSON.stringify(next));
      return next;
    });
  }, []);

  const isConnected = apiKey.length > 0;

  const CLIENT_CACHE_KEY = "yt_shorts_cache";
  const CLIENT_CACHE_TTL = 1000 * 60 * 60 * 6; // 6시간

  async function fetchShortsChannels(key: string, forceRefresh = false) {
    // 클라이언트 캐시 확인 (강제 새로고침이 아닐 때)
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(CLIENT_CACHE_KEY);
        if (cached) {
          const { channels: cachedChannels, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < CLIENT_CACHE_TTL && cachedChannels.length > 0) {
            setLiveChannels(cachedChannels);
            setDataSource("live");
            setIsReady(true);
            return;
          }
        }
      } catch { /* ignore */ }
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/youtube/shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "쇼츠 채널 분석에 실패했습니다");
        return;
      }

      if (data.channels && data.channels.length > 0) {
        setLiveChannels(data.channels);
        setDataSource("live");
        // 클라이언트 캐시 저장
        try {
          localStorage.setItem(CLIENT_CACHE_KEY, JSON.stringify({
            channels: data.channels,
            timestamp: Date.now(),
          }));
        } catch { /* quota exceeded */ }
      }
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setIsLoading(false);
      setIsReady(true);
    }
  }

  const fetchChannels = useCallback(
    async (query?: string) => {
      if (!apiKey) return;

      setIsLoading(true);
      setError("");

      try {
        const res = await fetch("/api/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            query: query || searchQuery || "한국 유튜브",
            category:
              selectedCategory !== "전체" ? selectedCategory : undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "API 요청에 실패했습니다");
          return;
        }

        if (data.channels) {
          setLiveChannels(data.channels);
          setDataSource("live");
        }
      } catch {
        setError("네트워크 오류가 발생했습니다");
      } finally {
        setIsLoading(false);
      }
    },
    [apiKey, searchQuery, selectedCategory]
  );

  const handleApiKeySave = (key: string) => {
    setApiKey(key);
    if (key) {
      fetchShortsChannels(key);
    } else {
      setLiveChannels([]);
      setDataSource("mock");
    }
  };

  const sourceChannels =
    dataSource === "live" && liveChannels.length > 0
      ? liveChannels
      : mockChannels;

  // 상세 페이지에서 비슷한 채널 추천용으로 저장 + 히스토리 스냅샷
  useEffect(() => {
    if (sourceChannels.length > 0) {
      try {
        localStorage.setItem("yt_all_channels", JSON.stringify(sourceChannels));
      } catch { /* quota exceeded */ }

      // 비율 히스토리 스냅샷 저장
      saveChannelSnapshots(
        sourceChannels.map((ch) => ({
          id: ch.id,
          viewToSubRatio: ch.viewToSubRatio,
          avgViews: ch.avgViews,
          subscribers: ch.subscribers,
          growthRate: ch.growthRate,
          score: calculateScore(ch),
        }))
      );
    }
  }, [sourceChannels]);

  // 한국/해외 탭 → 카테고리/검색 → 정렬
  const filteredChannels = useMemo(() => {
    let channels = [...sourceChannels];

    // 지역 필터 (global 검색 결과는 US에 포함)
    channels = channels.filter((ch) => {
      const r = ch.region || "kr";
      if (regionTab === "us") return r === "us" || r === "global";
      return r === regionTab;
    });

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      channels = channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          ch.description.toLowerCase().includes(q)
      );
    }

    if (selectedCategory !== "전체") {
      channels = channels.filter((ch) => ch.category === selectedCategory);
    }

    if (subRange !== "all") {
      channels = channels.filter((ch) => {
        const subs = ch.subscribers;
        switch (subRange) {
          case "0-1만":
            return subs < 10000;
          case "1만-5만":
            return subs >= 10000 && subs < 50000;
          case "5만-10만":
            return subs >= 50000 && subs < 100000;
          case "10만+":
            return subs >= 100000;
          default:
            return true;
        }
      });
    }

    if (channelAge === "1year") {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      channels = channels.filter((ch) => {
        if (!ch.createdAt) return false;
        return new Date(ch.createdAt) >= oneYearAgo;
      });
    }

    // 히든 젬: 구독자 5만 이하 + 비율 200% 이상
    if (showHiddenGems) {
      channels = channels.filter(
        (ch) => ch.subscribers <= 50000 && ch.viewToSubRatio >= 200
      );
    }

    // 급상승: 성장률 상위 채널 (평균의 1.5배 이상 + 200% 이상)
    if (showTrendingOnly) {
      const avgGrowth = channels.length > 0
        ? channels.reduce((s, ch) => s + ch.growthRate, 0) / channels.length
        : 0;
      const threshold = avgGrowth * 1.5;
      channels = channels.filter(
        (ch) => ch.growthRate >= threshold && ch.growthRate >= 200
      );
    }

    switch (sortBy) {
      case "score":
        channels.sort((a, b) => calculateScore(b) - calculateScore(a));
        break;
      case "ratio":
        channels.sort((a, b) => b.viewToSubRatio - a.viewToSubRatio);
        break;
      case "growth":
        channels.sort((a, b) => b.growthRate - a.growthRate);
        break;
      case "views":
        channels.sort((a, b) => b.avgViews - a.avgViews);
        break;
      case "subscribers":
        channels.sort((a, b) => b.subscribers - a.subscribers);
        break;
    }

    return channels;
  }, [sourceChannels, regionTab, searchQuery, selectedCategory, subRange, channelAge, showHiddenGems, showTrendingOnly, sortBy]);

  if (showLanding) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] bg-grid">
        <LandingHero
          onGetStarted={() => {
            localStorage.setItem("yt_has_visited", "1");
            setShowLanding(false);
            setIsModalOpen(true);
          }}
          onSkip={() => {
            localStorage.setItem("yt_has_visited", "1");
            setShowLanding(false);
            setTimeout(() => setIsReady(true), 800);
          }}
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-grid">
      <Header
        onApiKeyClick={() => setIsModalOpen(true)}
        isConnected={isConnected}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            쇼츠 떡상 채널을 <span className="gradient-text">발견</span>하세요
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            구독자 대비 쇼츠 조회수가 비정상적으로 높은 채널 = 알고리즘이
            밀어주는 떡상 직전 채널
          </p>
        </div>

        {/* 한국 / 미국 / 일본 탭 + 즐겨찾기 */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1">
            {([
              { key: "kr" as const, label: "한국" },
              { key: "us" as const, label: "미국" },
              { key: "jp" as const, label: "일본" },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRegionTab(tab.key)}
                className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all sm:flex-none sm:px-5 sm:py-2 ${
                  regionTab === tab.key
                    ? "bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] text-[#0a0a0f] shadow-lg shadow-[#00e5a0]/10"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFavoritesOnly((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all sm:py-2 ${
                showFavoritesOnly
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-400"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <svg
                className={`h-4 w-4 ${showFavoritesOnly ? "fill-amber-400" : "fill-none"}`}
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
              즐겨찾기
              {favorites.size > 0 && (
                <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                  {favorites.size}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowHiddenGems((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all sm:py-2 ${
                showHiddenGems
                  ? "border-purple-400/30 bg-purple-400/10 text-purple-400"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <span className="text-base">💎</span>
              히든 젬
            </button>

            <button
              onClick={() => setShowTrendingOnly((v) => !v)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all sm:py-2 ${
                showTrendingOnly
                  ? "border-orange-400/30 bg-orange-400/10 text-orange-400"
                  : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
              }`}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
              </svg>
              급상승
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              필터 초기화
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-6">
          <StatsOverview channels={filteredChannels} />
        </div>

        {/* 오늘의 발견 */}
        <div className="mb-6">
          <DailyDiscovery channels={filteredChannels} />
        </div>

        {/* TOP 3 Spotlight */}
        <div className="mb-6">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-600">
            떡상 지수 TOP 3
          </div>
          <TopSpotlight channels={filteredChannels} />
        </div>

        {/* 최근 본 채널 */}
        <div className="mb-6">
          <RecentlyViewed />
        </div>

        {/* Search & Filters */}
        <div className="mb-6">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            subRange={subRange}
            onSubRangeChange={setSubRange}
            channelAge={channelAge}
            onChannelAgeChange={setChannelAge}
          />
          {isConnected && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={() => fetchShortsChannels(apiKey, true)}
                disabled={isLoading}
                className="rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-5 py-2.5 text-sm font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
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
                    분석 중...
                  </span>
                ) : (
                  "쇼츠 떡상 채널 새로고침"
                )}
              </button>
              <button
                onClick={() => fetchChannels()}
                disabled={isLoading}
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 disabled:opacity-50"
              >
                키워드로 검색
              </button>
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading — Skeleton */}
        {(isLoading || !isReady) && (
          <div className="mb-6">
            <div className="mb-4 flex items-center gap-3 text-sm text-[#06b6d4]">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
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
              {isLoading ? "YouTube 쇼츠 채널을 분석하고 있습니다..." : "채널 데이터를 불러오는 중..."}
            </div>
            <SkeletonGrid />
          </div>
        )}

        {/* Data source indicator */}
        {dataSource === "live" && liveChannels.length > 0 && !isLoading && (
          <div className="mb-4 flex items-center gap-2 text-xs text-[#00e5a0]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00e5a0]" />
            실제 YouTube 쇼츠 데이터를 표시하고 있습니다
          </div>
        )}
        {dataSource === "mock" && !isLoading && (
          <div className="mb-4 flex items-center gap-2 text-xs text-zinc-600">
            <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
            샘플 데이터 표시 중 &mdash; API 키를 연동하면 실제 쇼츠 떡상 채널로
            자동 전환됩니다
          </div>
        )}

        {/* Channel Grid — 로딩 중엔 숨김 (스켈레톤으로 대체) */}
        {!isLoading && isReady && (
          <ChannelGrid
            channels={filteredChannels}
            favorites={favorites}
            favoriteOrder={favoriteOrder}
            onToggleFavorite={toggleFavorite}
            onReorderFavorites={reorderFavorites}
            showFavoritesOnly={showFavoritesOnly}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-600">
        YTFINDER &copy; 2026 &mdash; YouTube Data API 기반 쇼츠 채널 분석
        플랫폼
      </footer>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleApiKeySave}
      />

      {/* Scroll to top */}
      <ScrollToTop />
    </div>
  );
}
