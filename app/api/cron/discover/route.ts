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
// 한국 쇼츠 키워드 N개 검색 → 새 채널 ID 추출 → 통계 받아서 DB 저장
// quota 비용: search.list 100 × N + channels.list 1 × ceil(M/50)
// N=15 → 약 1500~1530 unit (전체 10K의 15%)

const SEARCH_QUERIES = [
  // 일반
  "쇼츠", "shorts 챌린지", "쇼츠 일상", "쇼츠 밈", "쇼츠 꿀팁",
  // 음식/요리
  "쇼츠 먹방", "쇼츠 요리", "쇼츠 베이킹", "shorts mukbang",
  // 운동/건강
  "쇼츠 운동", "쇼츠 다이어트", "쇼츠 헬스", "쇼츠 요가",
  // 게임/IT
  "쇼츠 게임", "shorts 게임 플레이", "쇼츠 IT", "쇼츠 코딩",
  // 펫/일상
  "쇼츠 펫", "쇼츠 강아지", "쇼츠 고양이",
  // 뷰티/패션
  "쇼츠 뷰티", "쇼츠 메이크업", "쇼츠 패션",
  // 엔터테인먼트
  "쇼츠 댄스", "쇼츠 노래", "쇼츠 ASMR", "쇼츠 웃긴",
  // 학습/정보
  "쇼츠 영어", "쇼츠 공부", "쇼츠 리뷰",
];

// mostPopular 카테고리 (1 unit/호출, 거의 공짜로 채널 추가 발굴)
const POPULAR_CATEGORIES = [
  "1", "2", "10", "15", "17", "19", "20",
  "22", "23", "24", "25", "26", "27", "28",
];

export async function GET(request: NextRequest) {
  const denied = verifyCronRequest(request);
  if (denied) return denied;

  const logId = await startLog("discover");
  const quota = new QuotaCounter();
  let totalChannels = 0;

  try {
    // 1) 검색으로 채널 ID 수집 (search.list 100 unit × N)
    const channelIdSet = new Set<string>();
    for (const q of SEARCH_QUERIES) {
      try {
        const found = await searchShortsChannels(q, quota);
        for (const f of found) channelIdSet.add(f.channelId);
      } catch (err) {
        console.error("[cron/discover] search failed", q, err);
      }
    }

    // 2) mostPopular로 채널 ID 추가 수집 (1 unit/카테고리 — 거의 공짜)
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (apiKey) {
      for (const cat of POPULAR_CATEGORIES) {
        try {
          const url =
            `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails` +
            `&chart=mostPopular&regionCode=KR&videoCategoryId=${cat}&maxResults=50&key=${apiKey}`;
          const res = await fetch(url);
          quota.add(1);
          if (!res.ok) continue;
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
      }
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
