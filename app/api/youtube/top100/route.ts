import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidApiKey } from "@/lib/validate";
import { verifyAccess } from "@/lib/verifyAccess";
import { getClientIp, maskError, verifySameOrigin } from "@/lib/security";

export interface TopVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  views: number;
  likes: number;
  comments: number;
  duration: number; // 초
  isShort: boolean;
  publishedAt: string;
  categoryId: string;
}

// mostPopular 카테고리 (1유닛 x N = 초저렴)
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

// 지원 국가
const SUPPORTED_REGIONS = ["KR", "JP", "US"] as const;
type Region = (typeof SUPPORTED_REGIONS)[number];

// 메모리 캐시 (서버 사이드, 국가별)
const cacheMap = new Map<Region, { videos: TopVideo[]; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 6; // 6시간

// 최근 N일 이내 영상만 표시
const RECENT_DAYS = 3;

function parseDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  return (
    parseInt(match[1] || "0") * 3600 +
    parseInt(match[2] || "0") * 60 +
    parseInt(match[3] || "0")
  );
}

// [1유닛/페이지] 카테고리별 인기 동영상 조회 — 3페이지(150개)까지
async function getMostPopular(apiKey: string, categoryId: string, region: Region) {
  const allItems: unknown[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < 3; page++) {
    const tokenParam = pageToken ? `&pageToken=${pageToken}` : "";
    const url = `https://www.googleapis.com/youtube/v3/videos?part=id,snippet,contentDetails,statistics&chart=mostPopular&regionCode=${region}&videoCategoryId=${categoryId}&maxResults=50${tokenParam}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) break;
    const data = await res.json();
    allItems.push(...(data.items || []));
    if (!data.nextPageToken) break; // 더 이상 페이지 없으면 중단
    pageToken = data.nextPageToken;
  }

  return { items: allItems, categoryId };
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
      console.warn("[top100] rate limit exceeded", { ip });
      return NextResponse.json(
        { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "요청 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const { apiKey, region: rawRegion } = body as {
      apiKey?: unknown;
      region?: unknown;
    };

    if (typeof apiKey !== "string" || !apiKey) {
      return NextResponse.json({ error: "API 키가 필요합니다" }, { status: 400 });
    }

    if (!isValidApiKey(apiKey)) {
      return NextResponse.json(
        { error: "API 키 형식이 올바르지 않습니다." },
        { status: 400 }
      );
    }

    // 국가 코드 검증 (기본값: KR)
    const region: Region = SUPPORTED_REGIONS.includes(rawRegion as Region)
      ? (rawRegion as Region)
      : "KR";

    // 캐시 확인 (국가별)
    const cached = cacheMap.get(region);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json({ videos: cached.videos, cached: true });
    }

    // === mostPopular 14개 카테고리 병렬 호출 (카테고리당 최대 3페이지, 최대 42유닛) ===
    const results = await Promise.all(
      POPULAR_CATEGORIES.map((cat) => getMostPopular(apiKey, cat, region))
    );

    // 영상 수집 + 중복 제거
    const videoMap = new Map<string, TopVideo>();

    for (const { items, categoryId } of results) {
      for (const item of items as {
        id: string;
        snippet: {
          title: string;
          channelId: string;
          channelTitle: string;
          publishedAt: string;
          thumbnails: {
            medium?: { url: string };
            high?: { url: string };
            default?: { url: string };
          };
        };
        contentDetails: { duration: string };
        statistics: {
          viewCount?: string;
          likeCount?: string;
          commentCount?: string;
        };
      }[]) {
        if (videoMap.has(item.id)) continue;

        const duration = parseDuration(item.contentDetails.duration);
        const views = parseInt(item.statistics.viewCount || "0", 10);
        if (views === 0) continue;

        videoMap.set(item.id, {
          id: item.id,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.default?.url ||
            "",
          channelId: item.snippet.channelId,
          channelTitle: item.snippet.channelTitle,
          views,
          likes: parseInt(item.statistics.likeCount || "0", 10),
          comments: parseInt(item.statistics.commentCount || "0", 10),
          duration,
          isShort: duration > 0 && duration <= 60,
          publishedAt: item.snippet.publishedAt,
          categoryId,
        });
      }
    }

    // 최근 N일 이내 영상만 필터 → 조회수 순 정렬 → 상위 300개
    const cutoff = Date.now() - RECENT_DAYS * 24 * 60 * 60 * 1000;
    const videos = [...videoMap.values()]
      .filter((v) => new Date(v.publishedAt).getTime() >= cutoff)
      .sort((a, b) => b.views - a.views)
      .slice(0, 300);

    cacheMap.set(region, { videos, timestamp: Date.now() });

    return NextResponse.json({ videos });
  } catch (error) {
    return maskError("top100", error);
  }
}
