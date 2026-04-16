"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import SearchBar, { type SubRange, type ChannelAge, type RevenueRange } from "@/components/SearchBar";
import ChannelGrid from "@/components/ChannelGrid";
import { calculateScore, calculateHoneyScore } from "@/lib/score";
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
import MemoOverview from "@/components/MemoOverview";
import BenchmarkList from "@/components/BenchmarkList";
import ChannelCompare from "@/components/ChannelCompare";
import ChannelLookup from "@/components/ChannelLookup";
import Top100Videos from "@/components/Top100Videos";
import AccessCodeGate from "@/components/AccessCodeGate";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

type TabId = "dashboard" | "explore" | "top100" | "activity";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "dashboard", label: "대시보드", icon: "📊" },
  { id: "explore", label: "채널 탐색", icon: "🔍" },
  { id: "top100", label: "Top 100", icon: "🔥" },
  { id: "activity", label: "내 활동", icon: "📁" },
];

const TAB_IDS = new Set<string>(TABS.map((t) => t.id));

const SESSION_TAB_KEY = "yt_active_tab";

function parseHash(): { tab: TabId; page: number } {
  if (typeof window === "undefined") return { tab: "dashboard", page: 0 };
  const hash = window.location.hash.replace("#", "");
  const [tabPart, pagePart] = hash.split(":");
  if (TAB_IDS.has(tabPart)) {
    return { tab: tabPart as TabId, page: pagePart ? Math.max(0, parseInt(pagePart, 10) || 0) : 0 };
  }
  // hash 없으면 sessionStorage에서 복원
  const saved = sessionStorage.getItem(SESSION_TAB_KEY);
  if (saved && TAB_IDS.has(saved)) {
    return { tab: saved as TabId, page: 0 };
  }
  return { tab: "dashboard", page: 0 };
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [gridPage, setGridPage] = useState(0);

  // 마운트 시 hash에서 탭+페이지 복원 + 뒤로가기 감지
  useEffect(() => {
    const restore = () => {
      const { tab, page } = parseHash();
      setActiveTab(tab);
      setGridPage(page);
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  // 탭 변경 시 hash 업데이트 (페이지 0으로 리셋)
  const changeTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setGridPage(0);
    window.location.hash = tab;
    sessionStorage.setItem(SESSION_TAB_KEY, tab);
  }, []);

  // 페이지 변경 시 hash 업데이트 (pushState로 뒤로가기 지원)
  const changeGridPage = useCallback((page: number) => {
    setGridPage(page);
    history.pushState(null, "", `#${activeTab}:${page}`);
  }, [activeTab]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [sortBy, setSortBy] = useState("honey");
  const [subRange, setSubRange] = useState<SubRange>("all");
  const [channelAge, setChannelAge] = useState<ChannelAge>("all");
  const [revenueRange, setRevenueRange] = useState<RevenueRange>("all");

  // 즐겨찾기 (순서 보존을 위해 배열도 관리)
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [favoriteOrder, setFavoriteOrder] = useState<string[]>([]);
  const [hiddenChannels, setHiddenChannels] = useState<Set<string>>(new Set());
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showHiddenGems, setShowHiddenGems] = useState(false);
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(false);
  const [showHiddenList, setShowHiddenList] = useState(false);

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedCategory !== "전체" ||
    subRange !== "all" ||
    channelAge !== "all" ||
    revenueRange !== "all" ||
    showFavoritesOnly ||
    showHiddenGems ||
    showTrendingOnly ||
    showActiveOnly;

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSelectedCategory("전체");
    setSortBy("honey");
    setSubRange("all");
    setChannelAge("all");
    setRevenueRange("all");
    setShowFavoritesOnly(false);
    setShowHiddenGems(false);
    setShowTrendingOnly(false);
    setShowActiveOnly(false);
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
    const savedHidden = localStorage.getItem("yt_hidden_channels");
    if (savedHidden) {
      try {
        setHiddenChannels(new Set(JSON.parse(savedHidden)));
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

  const hideChannel = useCallback((id: string) => {
    setHiddenChannels((prev) => {
      const next = new Set(prev);
      next.add(id);
      localStorage.setItem("yt_hidden_channels", JSON.stringify([...next]));
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

  const CLIENT_CACHE_KEY = "yt_shorts_cache_v2";
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const res = await fetchWithAuth("/api/youtube/shorts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: key }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const data = await res.json();

      if (!res.ok) {
        if (data.error?.includes("quota")) {
          setError("API 할당량을 초과했습니다. 내일 오후 4시 이후에 다시 시도해주세요.");
        } else if (data.error?.includes("API key")) {
          setError("API 키가 유효하지 않습니다. 키를 다시 확인해주세요.");
        } else {
          setError(data.error || "쇼츠 채널 분석에 실패했습니다");
        }
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
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
      } else {
        setError("네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.");
      }
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const res = await fetchWithAuth("/api/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            query: query || searchQuery || "한국 유튜브",
            category:
              selectedCategory !== "전체" ? selectedCategory : undefined,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const data = await res.json();

        if (!res.ok) {
          if (data.error?.includes("quota")) {
            setError("API 할당량을 초과했습니다. 내일 오후 4시 이후에 다시 시도해주세요.");
          } else if (data.error?.includes("API key")) {
            setError("API 키가 유효하지 않습니다. 키를 다시 확인해주세요.");
          } else {
            setError(data.error || "API 요청에 실패했습니다");
          }
          return;
        }

        if (data.channels) {
          setLiveChannels(data.channels);
          setDataSource("live");
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
    // 기본: 숨긴 채널 제외
    let channels = sourceChannels.filter((ch) => !hiddenChannels.has(ch.id));

    // 기본: 최근 3개월 이내 업로드가 없는 채널 제외
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    channels = channels.filter((ch) => {
      if (!ch.lastUploadDate) return true; // 데이터 없으면 일단 포함
      return new Date(ch.lastUploadDate) >= threeMonthsAgo;
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

    // 월 예상 수익 필터: (avgViews × monthlyUploads ÷ 2) × 0.3
    if (revenueRange !== "all") {
      const minRevenue = revenueRange === "50만+" ? 500000
        : revenueRange === "150만+" ? 1500000
        : revenueRange === "300만+" ? 3000000
        : 10000000;
      channels = channels.filter((ch) => {
        const uploads = ch.monthlyUploads ?? 0;
        const revenue = (ch.avgViews * uploads / 2) * 0.3;
        return revenue >= minRevenue;
      });
    }

    // 히든 젬: 구독자 5만 이하 + 비율 200% 이상
    if (showHiddenGems) {
      channels = channels.filter(
        (ch) => ch.subscribers <= 50000 && ch.viewToSubRatio >= 200
      );
    }

    // 활동 중: 최근 30일 내 업로드 1개 이상
    if (showActiveOnly) {
      channels = channels.filter(
        (ch) => ch.monthlyUploads !== undefined && ch.monthlyUploads >= 1
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
      case "honey":
        channels.sort((a, b) => calculateHoneyScore(b) - calculateHoneyScore(a));
        break;
      case "score":
        channels.sort((a, b) => calculateScore(b) - calculateScore(a));
        break;
      case "revenue":
        channels.sort((a, b) => {
          const revA = a.avgViews * (a.monthlyUploads ?? 0) / 2 * 0.3;
          const revB = b.avgViews * (b.monthlyUploads ?? 0) / 2 * 0.3;
          return revB - revA;
        });
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
  }, [sourceChannels, hiddenChannels, searchQuery, selectedCategory, subRange, channelAge, revenueRange, showHiddenGems, showTrendingOnly, showActiveOnly, sortBy]);

  if (showLanding) {
    return (
      <AccessCodeGate>
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
      </AccessCodeGate>
    );
  }

  return (
    <AccessCodeGate>
    <div className="flex min-h-screen flex-col bg-grid">
      <Header
        onApiKeyClick={() => setIsModalOpen(true)}
        isConnected={isConnected}
      />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {/* Hero */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            숨겨진 <span className="gradient-text">꿀통 채널</span>을 발견하세요
          </h2>
          <p className="mt-2 text-sm text-zinc-500">
            쇼츠로 실제 수익을 내고 있는 숨겨진 채널, 알고리즘이 밀어주는 진짜 꿀통을 찾아드립니다
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6 flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => changeTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ─── 대시보드 탭 ─── */}
        {activeTab === "dashboard" && (
          <>
            {/* 꿀채널인지 알아보기 */}
            <div className="mb-6">
              <ChannelLookup apiKey={apiKey} favorites={favorites} onToggleFavorite={toggleFavorite} />
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
                꿀통 지수 TOP 3
              </div>
              <TopSpotlight channels={filteredChannels} />
            </div>
          </>
        )}

        {/* ─── 채널 탐색 탭 ─── */}
        {activeTab === "explore" && (
          <>
            {/* 필터 버튼 */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
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

                <div className="group/gem relative">
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
                  <div className="invisible absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-[11px] leading-relaxed text-zinc-400 opacity-0 shadow-xl break-keep transition-all group-hover/gem:visible group-hover/gem:opacity-100">
                    구독자 5만 이하이지만 조회/구독 비율이 200% 이상인 채널. 아직 덜 알려졌지만 알고리즘을 타고 있는 숨겨진 보석!
                  </div>
                </div>

                <div className="group/trend relative">
                  <button
                    onClick={() => setShowTrendingOnly((v) => !v)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all sm:py-2 ${
                      showTrendingOnly
                        ? "border-orange-400/30 bg-orange-400/10 text-orange-400"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base">🔥</span>
                    <span className={showTrendingOnly ? "text-orange-400" : "text-orange-400/70"}>급상승</span>
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-[11px] leading-relaxed text-zinc-400 opacity-0 shadow-xl break-keep transition-all group-hover/trend:visible group-hover/trend:opacity-100">
                    성장률이 평균의 1.5배 이상이고 200% 이상인 채널. 지금 가장 빠르게 성장 중인 채널만 모아보기!
                  </div>
                </div>

                <div className="group/active relative">
                  <button
                    onClick={() => setShowActiveOnly((v) => !v)}
                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all sm:py-2 ${
                      showActiveOnly
                        ? "border-green-400/30 bg-green-400/10 text-green-400"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/10"
                    }`}
                  >
                    <span className="text-base">📡</span>
                    활동 중
                  </button>
                  <div className="invisible absolute left-0 top-full z-50 mt-1.5 w-56 rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-[11px] leading-relaxed text-zinc-400 opacity-0 shadow-xl break-keep transition-all group-hover/active:visible group-hover/active:opacity-100">
                    최근 30일 내 영상을 올린 채널만 보기. 꾸준히 활동 중인 채널을 찾을 수 있어요!
                  </div>
                </div>
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

              {hiddenChannels.size > 0 && (
                <div className="relative">
                  <button
                    onClick={() => setShowHiddenList((v) => !v)}
                    className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-400 transition-all hover:bg-white/10"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    숨긴 채널 {hiddenChannels.size}개
                    <svg className={`h-3 w-3 transition-transform ${showHiddenList ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>
                  {showHiddenList && (
                    <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow-2xl">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-400">숨긴 채널 목록</span>
                        <button
                          onClick={() => {
                            setHiddenChannels(new Set());
                            localStorage.removeItem("yt_hidden_channels");
                            setShowHiddenList(false);
                          }}
                          className="text-[11px] text-zinc-500 hover:text-zinc-300"
                        >
                          전체 복원
                        </button>
                      </div>
                      <div className="flex max-h-48 flex-col gap-1 overflow-y-auto">
                        {[...hiddenChannels].map((id) => {
                          const ch = sourceChannels.find((c) => c.id === id);
                          return (
                            <div key={id} className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                              <span className="truncate text-xs text-zinc-300">{ch?.name || id}</span>
                              <button
                                onClick={() => {
                                  setHiddenChannels((prev) => {
                                    const next = new Set(prev);
                                    next.delete(id);
                                    if (next.size === 0) {
                                      localStorage.removeItem("yt_hidden_channels");
                                    } else {
                                      localStorage.setItem("yt_hidden_channels", JSON.stringify([...next]));
                                    }
                                    return next;
                                  });
                                }}
                                className="shrink-0 ml-2 rounded-md bg-white/10 px-2 py-1 text-[10px] font-medium text-zinc-300 hover:bg-white/20"
                              >
                                복원
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
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
                revenueRange={revenueRange}
                onRevenueRangeChange={setRevenueRange}
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
                      "쇼츠 꿀통 채널 새로고침"
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
              <div className="mb-6 flex items-center justify-between rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <span>{error}</span>
                <button
                  onClick={() => { setError(""); fetchShortsChannels(apiKey, true); }}
                  className="ml-4 shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-white/20"
                >
                  다시 시도
                </button>
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

            {/* Channel Grid */}
            {!isLoading && isReady && (
              <ChannelGrid
                channels={filteredChannels}
                favorites={favorites}
                favoriteOrder={favoriteOrder}
                onToggleFavorite={toggleFavorite}
                onReorderFavorites={reorderFavorites}
                onHideChannel={hideChannel}
                showFavoritesOnly={showFavoritesOnly}
                page={gridPage}
                onPageChange={changeGridPage}
              />
            )}
          </>
        )}

        {/* ─── Top 100 탭 ─── */}
        {activeTab === "top100" && (
          <Top100Videos apiKey={apiKey} />
        )}

        {/* ─── 내 활동 탭 ─── */}
        {activeTab === "activity" && (
          <>
            {/* 즐겨찾기 */}
            <div className="mb-6">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <div className="mb-3 flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-zinc-300">즐겨찾기</h3>
                  {favorites.size > 0 && (
                    <span className="rounded-full bg-amber-400/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-400">
                      {favorites.size}
                    </span>
                  )}
                </div>
                {favorites.size === 0 ? (
                  <p className="text-xs text-zinc-600">아직 즐겨찾기한 채널이 없어요. 채널 카드의 ⭐ 버튼을 눌러 추가해보세요!</p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {favoriteOrder
                      .map((id) => {
                        const ch = sourceChannels.find((c) => c.id === id);
                        if (ch) return { id: ch.id, name: ch.name, thumbnail: ch.thumbnail || "" };
                        // sourceChannels에 없는 경우: 상세페이지 캐시 → 검색 기록 순으로 탐색
                        try {
                          const detailCache = localStorage.getItem(`yt_channel_v2_${id}`);
                          if (detailCache) {
                            const { channel: cached } = JSON.parse(detailCache);
                            if (cached?.name) return { id, name: cached.name, thumbnail: cached.thumbnail || "" };
                          }
                        } catch { /* ignore */ }
                        try {
                          const lookupHistory = localStorage.getItem("yt_lookup_history");
                          if (lookupHistory) {
                            const items = JSON.parse(lookupHistory);
                            const found = items.find((h: { id: string }) => h.id === id);
                            if (found) return { id, name: found.name, thumbnail: found.thumbnail || "" };
                          }
                        } catch { /* ignore */ }
                        return { id, name: id, thumbnail: "" };
                      })
                      .map((ch) => (
                        <Link
                          key={ch.id}
                          href={`/channel/${ch.id}`}
                          className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-3 transition-all hover:border-amber-400/20 hover:bg-white/[0.06]"
                        >
                          {ch.thumbnail ? (
                            <img
                              src={ch.thumbnail}
                              alt={ch.name}
                              className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-yellow-500 text-sm font-bold text-white">
                              {ch.name.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-zinc-200">{ch.name}</div>
                          </div>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(ch.id); }}
                            className="flex h-8 w-8 items-center justify-center rounded-full text-amber-400 opacity-0 transition-all hover:bg-white/10 group-hover:opacity-100"
                            title="즐겨찾기 해제"
                          >
                            <svg className="h-4 w-4 fill-amber-400" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                          </button>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* 최근 본 채널 */}
            <div className="mb-6">
              <RecentlyViewed />
            </div>

            {/* 메모 모아보기 */}
            <MemoOverview />

            {/* 벤치마킹 영상 */}
            <BenchmarkList />

            {/* 채널 비교 */}
            <ChannelCompare channels={sourceChannels} />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-zinc-600">
        &copy; 2026 시나브로. All rights reserved.
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
    </AccessCodeGate>
  );
}
