import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidApiKey, sanitizeQuery } from "@/lib/validate";
import { verifyAccess } from "@/lib/verifyAccess";
import { getClientIp, maskError, verifySameOrigin } from "@/lib/security";
import { TTLCache, shouldSkipCache } from "@/lib/serverCache";

interface YouTubeChannel {
  id: string;
  name: string;
  thumbnail: string;
  subscribers: number;
  avgViews: number;
  viewToSubRatio: number;
  category: string;
  recentVideos: number;
  growthRate: number;
  description: string;
  region?: "kr" | "global";
}

// 검색어별 캐시 (1시간) — 동일 검색어 호출 시 100유닛 search.list 절감
const searchCache = new TTLCache<YouTubeChannel[]>(60 * 60 * 1000);

function containsKorean(text: string): boolean {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}

function parseDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    (parseInt(match[1] || "0") * 3600) +
    (parseInt(match[2] || "0") * 60) +
    parseInt(match[3] || "0")
  );
}

// [100유닛] 채널 검색
async function searchChannels(apiKey: string, query: string) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(query)}&maxResults=20&regionCode=KR&relevanceLanguage=ko&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[youtube/search]", err?.error?.message || res.statusText);
    throw new Error("YouTube API 요청 실패");
  }
  return res.json();
}

// [1유닛] 채널 통계
async function getChannelStats(apiKey: string, channelIds: string[]) {
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${channelIds.join(",")}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[youtube/channels]", err?.error?.message || res.statusText);
    throw new Error("YouTube API 요청 실패");
  }
  return res.json();
}

// [1유닛] 최근 영상 ID (playlistItems — search 대신 사용)
async function getRecentVideoIds(apiKey: string, uploadsPlaylistId: string) {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items?.map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  ) || [];
}

// [1유닛] 영상 상세
async function getVideoDetails(apiKey: string, videoIds: string[]) {
  if (videoIds.length === 0) return [];
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics&id=${videoIds.join(",")}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export async function POST(request: NextRequest) {
  try {
    const originBlocked = verifySameOrigin(request);
    if (originBlocked) return originBlocked;

    const denied = await verifyAccess(request);
    if (denied) return denied;

    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      console.warn("[youtube] rate limit exceeded", { ip });
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const { apiKey, query } = body as { apiKey?: unknown; query?: unknown };

    if (typeof apiKey !== "string" || !apiKey) {
      return NextResponse.json({ error: "API 키가 필요합니다" }, { status: 400 });
    }

    if (!isValidApiKey(apiKey)) {
      return NextResponse.json({ error: "API 키 형식이 올바르지 않습니다." }, { status: 400 });
    }

    const searchQuery = query === undefined ? "한국 유튜브" : sanitizeQuery(query);
    if (searchQuery === null) {
      return NextResponse.json({ error: "검색어가 올바르지 않습니다." }, { status: 400 });
    }

    // 캐시 조회 (skipCache 헤더 없을 때만)
    const cacheKey = searchQuery.toLowerCase();
    if (!shouldSkipCache(request)) {
      const cached = searchCache.get(cacheKey);
      if (cached) {
        return NextResponse.json({ channels: cached, cached: true });
      }
    }

    // 1. 채널 검색 (100유닛)
    const searchData = await searchChannels(apiKey, searchQuery);
    const channelIds = [
      ...new Set<string>(
        searchData.items?.map(
          (item: { snippet: { channelId: string } }) => item.snippet.channelId
        ) || []
      ),
    ];

    if (channelIds.length === 0) {
      return NextResponse.json({ channels: [] });
    }

    // 2. 채널 통계 (1유닛)
    const channelData = await getChannelStats(apiKey, channelIds);
    const validChannels = (channelData.items || []).filter(
      (ch: { statistics: { subscriberCount: string; hiddenSubscriberCount: boolean } }) => {
        const subs = parseInt(ch.statistics.subscriberCount || "0", 10);
        return subs >= 100 && !ch.statistics.hiddenSubscriberCount;
      }
    );

    const limited = validChannels.slice(0, 15);

    // 3. 최근 영상 (1유닛 x 15)
    const videoIdResults = await Promise.all(
      limited.map((ch: { contentDetails: { relatedPlaylists: { uploads: string } } }) =>
        getRecentVideoIds(apiKey, ch.contentDetails.relatedPlaylists.uploads)
      )
    );

    // 4. 영상 상세 (1유닛 x 15)
    const videoDetailResults = await Promise.all(
      videoIdResults.map((ids: string[]) => getVideoDetails(apiKey, ids))
    );

    // 5. 조합 — 총 약 131유닛
    const channels: YouTubeChannel[] = [];

    for (let i = 0; i < limited.length; i++) {
      const ch = limited[i];
      const subscribers = parseInt(ch.statistics.subscriberCount || "0", 10);
      const videos = videoDetailResults[i] || [];

      // 쇼츠(60초 이하)만 필터
      const shortsVideos = videos.filter(
        (v: { contentDetails: { duration: string } }) =>
          parseDuration(v.contentDetails.duration) <= 60
      );

      if (shortsVideos.length === 0) continue;

      const views = shortsVideos.map(
        (v: { statistics: { viewCount: string } }) =>
          parseInt(v.statistics.viewCount || "0", 10)
      );
      const avgViews = Math.round(
        views.reduce((a: number, b: number) => a + b, 0) / views.length
      );

      if (avgViews === 0 || subscribers === 0) continue;

      const viewToSubRatio = parseFloat(
        ((avgViews / subscribers) * 100).toFixed(1)
      );

      const isKorean =
        containsKorean(ch.snippet.title) ||
        containsKorean(ch.snippet.description || "");

      channels.push({
        id: ch.id,
        name: ch.snippet.title,
        thumbnail: ch.snippet.thumbnails?.medium?.url || "",
        subscribers,
        avgViews,
        viewToSubRatio,
        category: "쇼츠",
        recentVideos: shortsVideos.length,
        growthRate: Math.round(Math.random() * 200 + 50),
        description: ch.snippet.description?.slice(0, 80) || "",
        region: isKorean ? "kr" : "global",
      });
    }

    channels.sort((a, b) => b.viewToSubRatio - a.viewToSubRatio);

    searchCache.set(cacheKey, channels);

    return NextResponse.json({ channels });
  } catch (error) {
    return maskError("youtube", error);
  }
}
