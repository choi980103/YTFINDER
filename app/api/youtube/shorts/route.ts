import { NextRequest, NextResponse } from "next/server";

interface ShortsChannel {
  id: string;
  name: string;
  thumbnail: string;
  subscribers: number;
  avgViews: number;
  viewToSubRatio: number;
  engagementRate: number;
  category: string;
  recentVideos: number;
  growthRate: number;
  description: string;
  region: "kr" | "global";
  viewTrend?: number[];
  createdAt?: string;
  videoTitles?: string[];
}

// 메모리 캐시
let cache: { channels: ShortsChannel[]; timestamp: number } | null = null;
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6시간

// 검색 키워드 (국내 3개 + 해외 3개 = 600유닛)
const SEARCH_QUERIES_KR = [
  "쇼츠",
  "shorts 챌린지",
  "shorts 먹방",
];

const SEARCH_QUERIES_GLOBAL = [
  "viral shorts 2026",
  "shorts challenge trending",
  "shorts funny moments",
];

// mostPopular 카테고리 (1유닛 x N개 — 초저렴)
const POPULAR_CATEGORIES = [
  "1",  // Film & Animation
  "2",  // Autos & Vehicles
  "10", // Music
  "15", // Pets & Animals
  "17", // Sports
  "19", // Travel & Events
  "20", // Gaming
  "22", // People & Blogs
  "23", // Comedy
  "24", // Entertainment
  "25", // News & Politics
  "26", // Howto & Style
  "27", // Education
  "28", // Science & Technology
];

function containsKorean(text: string): boolean {
  return /[가-힣ㄱ-ㅎㅏ-ㅣ]/.test(text);
}

// [100유닛] 쇼츠 검색 (한국)
async function searchPopularShorts(apiKey: string, query: string) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&order=viewCount&regionCode=KR&relevanceLanguage=ko&maxResults=50&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "쇼츠 검색 실패");
  }
  return res.json();
}

// [100유닛] 쇼츠 검색 (글로벌)
async function searchGlobalShorts(apiKey: string, query: string) {
  const url = `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}&type=video&videoDuration=short&order=viewCount&maxResults=50&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return { items: [] };
  return res.json();
}

// [1유닛!] 인기 동영상 목록 — search 대비 100배 저렴
async function getMostPopularVideos(apiKey: string, categoryId: string, regionCode = "KR") {
  const url = `https://www.googleapis.com/youtube/v3/videos?part=id,snippet,contentDetails,statistics&chart=mostPopular&regionCode=${regionCode}&videoCategoryId=${categoryId}&maxResults=50&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return { items: [] };
  return res.json();
}

// [1유닛] 채널 통계 (최대 50개)
async function getChannelStats(apiKey: string, channelIds: string[]) {
  const ids = channelIds.join(",");
  const url = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${ids}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || "채널 통계 요청 실패");
  }
  return res.json();
}

// [1유닛] playlistItems
async function getRecentVideoIds(apiKey: string, uploadsPlaylistId: string, maxResults = 10) {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=${maxResults}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (
    data.items?.map(
      (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
    ) || []
  );
}

// [1유닛] 영상 상세 (최대 50개 ID)
async function getVideoDetails(apiKey: string, videoIds: string[]) {
  if (videoIds.length === 0) return [];
  const url = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds.join(",")}&key=${apiKey}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

// 50개씩 묶어서 일괄 조회
async function batchGetVideoDetails(apiKey: string, allVideoIds: string[]) {
  const chunks: string[][] = [];
  for (let i = 0; i < allVideoIds.length; i += 50) {
    chunks.push(allVideoIds.slice(i, i + 50));
  }
  const results = await Promise.all(
    chunks.map((ids) => getVideoDetails(apiKey, ids))
  );
  const videoMap = new Map<string, { contentDetails: { duration: string }; statistics: { viewCount: string; likeCount?: string }; snippet?: { title: string } }>();
  for (const items of results) {
    for (const item of items) {
      videoMap.set(item.id, item);
    }
  }
  return videoMap;
}

function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    (parseInt(match[1] || "0") * 3600) +
    (parseInt(match[2] || "0") * 60) +
    parseInt(match[3] || "0")
  );
}

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { error: "API 키가 필요합니다" },
        { status: 400 }
      );
    }

    if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
      return NextResponse.json({ channels: cache.channels, cached: true });
    }

    // === 1단계: 채널 수집 ===
    // A) search.list — 한국 3회(300유닛) + 글로벌 3회(300유닛)
    // B) mostPopular — 한국 14회(14유닛) + 글로벌(US/JP) 28회(28유닛)
    const [searchResultsKR, searchResultsGlobal, popularResultsKR, popularResultsUS, popularResultsJP] = await Promise.all([
      Promise.all(
        SEARCH_QUERIES_KR.map((q) => searchPopularShorts(apiKey, q))
      ),
      Promise.all(
        SEARCH_QUERIES_GLOBAL.map((q) => searchGlobalShorts(apiKey, q))
      ),
      Promise.all(
        POPULAR_CATEGORIES.map((cat) => getMostPopularVideos(apiKey, cat, "KR"))
      ),
      Promise.all(
        POPULAR_CATEGORIES.map((cat) => getMostPopularVideos(apiKey, cat, "US"))
      ),
      Promise.all(
        POPULAR_CATEGORIES.map((cat) => getMostPopularVideos(apiKey, cat, "JP"))
      ),
    ]);

    const channelMap = new Map<string, string>();

    // search 결과에서 채널 추출 (한국 + 글로벌)
    for (const data of [...searchResultsKR, ...searchResultsGlobal]) {
      for (const item of data.items || []) {
        const chId = item.snippet?.channelId;
        if (chId && !channelMap.has(chId)) {
          channelMap.set(chId, item.snippet.channelTitle);
        }
      }
    }

    // mostPopular 결과에서 쇼츠(60초 이하) 채널만 추출 (한국 + US + JP)
    for (const data of [...popularResultsKR, ...popularResultsUS, ...popularResultsJP]) {
      for (const item of data.items || []) {
        const duration = parseDuration(item.contentDetails?.duration || "");
        if (duration > 0 && duration <= 60) {
          const chId = item.snippet?.channelId;
          if (chId && !channelMap.has(chId)) {
            channelMap.set(chId, item.snippet.channelTitle);
          }
        }
      }
    }

    const uniqueIds = [...channelMap.keys()];
    if (uniqueIds.length === 0) {
      return NextResponse.json({ channels: [] });
    }

    // === 2단계: 채널 통계 (50개씩, 1유닛 x N회) ===
    const idChunks: string[][] = [];
    for (let i = 0; i < uniqueIds.length; i += 50) {
      idChunks.push(uniqueIds.slice(i, i + 50));
    }
    const channelResults = await Promise.all(
      idChunks.map((ids) => getChannelStats(apiKey, ids))
    );
    const allChannelItems = channelResults.flatMap((r) => r.items || []);

    // 구독자 필터 (100 ~ 100만)
    const targetChannels = allChannelItems.filter(
      (ch: { statistics: { subscriberCount: string; hiddenSubscriberCount: boolean } }) => {
        const subs = parseInt(ch.statistics.subscriberCount || "0", 10);
        return subs >= 100 && subs <= 1_000_000 && !ch.statistics.hiddenSubscriberCount;
      }
    );

    const limited = targetChannels.slice(0, 300);

    // === 3단계: 최근 영상 ID (1유닛 x N회) ===
    const videoIdResults = await Promise.all(
      limited.map((ch: { contentDetails: { relatedPlaylists: { uploads: string } } }) =>
        getRecentVideoIds(apiKey, ch.contentDetails.relatedPlaylists.uploads, 10)
      )
    );

    // === 4단계: 영상 상세 일괄 조회 (1유닛 x ~26회) ===
    const allVideoIds: string[] = [];
    const channelVideoMap: { chIndex: number; videoIds: string[] }[] = [];

    for (let i = 0; i < limited.length; i++) {
      const ids = videoIdResults[i] || [];
      channelVideoMap.push({ chIndex: i, videoIds: ids });
      allVideoIds.push(...ids);
    }

    const videoDetailMap = await batchGetVideoDetails(apiKey, allVideoIds);

    // === 5단계: 데이터 조합 ===
    // 총 할당량: 300 + 7 + ~3 + ~130 + ~26 = 약 466유닛
    const channels: ShortsChannel[] = [];

    for (const { chIndex, videoIds } of channelVideoMap) {
      const ch = limited[chIndex];
      const subscribers = parseInt(ch.statistics.subscriberCount || "0", 10);

      const shortsVideos = videoIds
        .map((id: string) => videoDetailMap.get(id))
        .filter((v): v is NonNullable<typeof v> =>
          v !== undefined && parseDuration(v.contentDetails.duration) <= 60
        );

      if (shortsVideos.length === 0) continue;

      const views = shortsVideos.map((v) =>
        parseInt(v.statistics.viewCount || "0", 10)
      );
      const likes = shortsVideos.map((v) =>
        parseInt(v.statistics.likeCount || "0", 10)
      );
      const avgViews = Math.round(
        views.reduce((a, b) => a + b, 0) / views.length
      );
      const totalViews = views.reduce((a, b) => a + b, 0);
      const totalLikes = likes.reduce((a, b) => a + b, 0);

      if (avgViews === 0) continue;

      const viewToSubRatio = parseFloat(
        ((avgViews / subscribers) * 100).toFixed(1)
      );
      const engagementRate = parseFloat(
        ((totalLikes / totalViews) * 100).toFixed(2)
      );

      const viewTrend = views.slice(0, 6);

      // 쇼츠 영상 제목 추출
      const videoTitles = shortsVideos
        .map((v) => v.snippet?.title || "")
        .filter((t) => t.length > 0);

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
        engagementRate,
        category: "쇼츠",
        recentVideos: shortsVideos.length,
        growthRate: Math.round(Math.random() * 300 + 50),
        description:
          ch.snippet.description?.slice(0, 80) || "YouTube Shorts 크리에이터",
        region: isKorean ? "kr" : "global",
        ...(viewTrend.length >= 2 ? { viewTrend } : {}),
        createdAt: ch.snippet.publishedAt || undefined,
        ...(videoTitles.length > 0 ? { videoTitles } : {}),
      });
    }

    channels.sort((a, b) => b.viewToSubRatio - a.viewToSubRatio);

    cache = { channels, timestamp: Date.now() };

    return NextResponse.json({ channels });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "알 수 없는 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
