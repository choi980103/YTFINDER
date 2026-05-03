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

// 신규 채널 발굴 cron — 매일 KST 18:00
// 한국 쇼츠 키워드 N개 검색 → 새 채널 ID 추출 → 통계 받아서 DB 저장
// quota 비용: search.list 100 × N + channels.list 1 × ceil(M/50)
// N=15 → 약 1500~1530 unit (전체 10K의 15%)

const SEARCH_QUERIES = [
  "쇼츠",
  "shorts 챌린지",
  "shorts 먹방",
  "쇼츠 운동 루틴",
  "쇼츠 요리 레시피",
  "쇼츠 꿀팁",
  "쇼츠 웃긴 편집",
  "쇼츠 밈 모음",
  "쇼츠 일상",
  "쇼츠 댄스",
  "쇼츠 게임",
  "쇼츠 펫",
  "쇼츠 ASMR",
  "쇼츠 리뷰",
  "쇼츠 뷰티",
];

export async function GET(request: NextRequest) {
  const denied = verifyCronRequest(request);
  if (denied) return denied;

  const logId = await startLog("discover");
  const quota = new QuotaCounter();
  let totalChannels = 0;

  try {
    // 1) 검색으로 채널 ID 수집
    const channelIdSet = new Set<string>();
    for (const q of SEARCH_QUERIES) {
      try {
        const found = await searchShortsChannels(q, quota);
        for (const f of found) channelIdSet.add(f.channelId);
      } catch (err) {
        console.error("[cron/discover] search failed", q, err);
        // 한 키워드 실패해도 다른 키워드 계속 진행
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
