import { NextRequest, NextResponse } from "next/server";
import {
  QuotaCounter,
  finishLog,
  getChannelStatsBatch,
  insertSnapshots,
  searchShortsChannels,
  startLog,
  upsertChannels,
  verifyCronRequest,
} from "@/lib/collector";

// Vercel function 최대 실행 시간 (Pro: 60s)
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// 신규 채널 발굴 cron — 매일 KST 18:00
// 양산형/재미편집 채널 위주 키워드 (커밋 818297c 의도 유지)
// quota 비용: search.list 100 × N + channels.list 1 × ceil(M/50)
// N=30 → 약 3000 unit (전체 10K의 30%)

const SEARCH_QUERIES = [
  // 베이스 (필수 양산형 패턴)
  "쇼츠", "shorts 챌린지", "쇼츠 모음", "쇼츠 레전드", "쇼츠 명장면",
  // 재미/밈 편집 (양산형 핵심)
  "쇼츠 밈", "쇼츠 밈 모음", "쇼츠 웃긴", "쇼츠 웃긴 편집", "쇼츠 재미 편집",
  "쇼츠 짤", "쇼츠 짤방", "쇼츠 클립", "쇼츠 꿀잼",
  // 자극/반응 (양산형 트래픽)
  "쇼츠 사이다", "쇼츠 반전", "쇼츠 충격", "쇼츠 명대사",
  // 정보/꿀팁 (1분 압축형)
  "쇼츠 꿀팁", "쇼츠 정보", "쇼츠 1분", "쇼츠 1분요약", "쇼츠 랭킹",
  // 핵심 카테고리 (양산형이 잘 나오는)
  "쇼츠 먹방", "shorts mukbang", "쇼츠 요리", "쇼츠 운동", "쇼츠 게임",
  // 영상편집 키워드
  "쇼츠 영상편집", "쇼츠 갈무리",
];

// mostPopular 카테고리 (1 unit/호출, 거의 공짜로 채널 추가 발굴)
const POPULAR_CATEGORIES = [
  "1", "2", "10", "15", "17", "19", "20",
  "22", "23", "24", "25", "26", "27", "28",
];

// Vercel 60s timeout 회피용 동시성 제한
const SEARCH_CONCURRENCY = 8;
const POPULAR_CONCURRENCY = 8;

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const batch = items.slice(i, i + size);
    const results = await Promise.all(batch.map(fn));
    out.push(...results);
  }
  return out;
}

export async function GET(request: NextRequest) {
  const denied = verifyCronRequest(request);
  if (denied) return denied;

  const logId = await startLog("discover");
  const quota = new QuotaCounter();
  let totalChannels = 0;

  try {
    // 1) 검색으로 채널 ID 수집 (search.list 100 unit × N) — 병렬
    const channelIdSet = new Set<string>();
    await inBatches(SEARCH_QUERIES, SEARCH_CONCURRENCY, async (q) => {
      try {
        const found = await searchShortsChannels(q, quota);
        for (const f of found) channelIdSet.add(f.channelId);
      } catch (err) {
        console.error("[cron/discover] search failed", q, err);
      }
    });

    // 2) mostPopular로 채널 ID 추가 수집 (1 unit/카테고리 — 거의 공짜) — 병렬
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      await inBatches(POPULAR_CATEGORIES, POPULAR_CONCURRENCY, async (cat) => {
        try {
          const url =
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails` +
            `&chart=mostPopular&regionCode=KR&videoCategoryId=${cat}&maxResults=50&key=${apiKey}`;
          const res = await fetch(url);
          quota.add(1);
          if (!res.ok) return;
          const data = await res.json();
          for (const item of (data.items || []) as {
            snippet?: { channelId: string };
            contentDetails?: { duration: string };
          }[]) {
            // 쇼츠(60초 이하)만
            const dur = item.contentDetails?.duration || "";
            const m = dur.match(/PT(?:(\d+)M)?(?:(\d+)S)?/);
            const seconds = m ? (parseInt(m[1] || "0") * 60 + parseInt(m[2] || "0")) : 999;
            if (seconds > 60) continue;
            const chId = item.snippet?.channelId;
            if (chId) channelIdSet.add(chId);
          }
        } catch (err) {
          console.error("[cron/discover] mostPopular failed", cat, err);
        }
      });
    }

    const channelIds = [...channelIdSet];
    if (channelIds.length === 0) {
      await finishLog(logId, "success", { channels: 0, quota: quota.total });
      return NextResponse.json({ ok: true, channels: 0, quota: quota.total });
    }

    // 2) 채널 통계 받아서 저장 (50개씩)
    const channels = await getChannelStatsBatch(channelIds, quota);

    // 필터: 구독자 100 ~ 100만, 숨기지 않은 채널만
    const filtered = channels.filter(
      (c) => c.subscribers >= 100 && c.subscribers <= 1_000_000 && !c.hiddenSubscriberCount
    );

    await upsertChannels(filtered);
    await insertSnapshots(filtered);
    totalChannels = filtered.length;

    await finishLog(logId, "success", { channels: totalChannels, quota: quota.total });
    return NextResponse.json({
      ok: true,
      discovered: channelIds.length,
      saved: totalChannels,
      quota: quota.total,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/discover] fatal", msg);
    await finishLog(logId, "failed", { channels: totalChannels, quota: quota.total, error: msg });
    return NextResponse.json({ error: msg, quota: quota.total }, { status: 500 });
  }
}
