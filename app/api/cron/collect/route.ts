import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import {
  QuotaCounter,
  finishLog,
  getChannelStatsBatch,
  getRecentVideoIds,
  getVideoDetailsBatch,
  insertSnapshots,
  startLog,
  upsertChannels,
  upsertVideos,
  verifyCronRequest,
} from "@/lib/collector";

// 채널/영상 정기 갱신 cron — 매일 KST 18:30
// 가장 오래된(혹은 갱신되지 않은) 채널부터 N개 처리
// quota 비용: channels.list 1×ceil(N/50) + playlistItems 1×N + videos.list 1×ceil(V/50)
// N=300, V=50개/채널 = 15000개 → 6 + 300 + 300 = ~606 unit

const MAX_CHANNELS_PER_RUN = 300;
const MAX_VIDEOS_PER_CHANNEL = 50;

export async function GET(request: NextRequest) {
  const denied = verifyCronRequest(request);
  if (denied) return denied;

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Supabase 미설정" }, { status: 500 });
  }

  const logId = await startLog("collect");
  const quota = new QuotaCounter();
  let processedChannels = 0;
  let processedVideos = 0;

  try {
    // 1) 갱신 대상 채널 선정 — 마지막 수집 시점 가장 오래된 N개 (NULL 우선)
    const { data: targets, error: tgtErr } = await admin
      .from("channels")
      .select("id")
      .eq("is_active", true)
      .order("last_collected_at", { ascending: true, nullsFirst: true })
      .limit(MAX_CHANNELS_PER_RUN);

    if (tgtErr) throw new Error(`target select: ${tgtErr.message}`);
    const channelIds = (targets || []).map((r) => r.id as string);
    if (channelIds.length === 0) {
      await finishLog(logId, "success", { channels: 0, quota: quota.total });
      return NextResponse.json({ ok: true, channels: 0, quota: quota.total });
    }

    // 2) 채널 통계 갱신
    const channels = await getChannelStatsBatch(channelIds, quota);
    await upsertChannels(channels);
    await insertSnapshots(channels);
    processedChannels = channels.length;

    // 3) 각 채널의 최근 영상 ID 수집
    const allVideoIds: string[] = [];
    const videoToChannel = new Map<string, string>();
    for (const ch of channels) {
      if (!ch.uploadsPlaylistId) continue;
      try {
        const ids = await getRecentVideoIds(ch.uploadsPlaylistId, MAX_VIDEOS_PER_CHANNEL, quota);
        for (const id of ids) {
          if (!videoToChannel.has(id)) {
            videoToChannel.set(id, ch.id);
            allVideoIds.push(id);
          }
        }
      } catch (err) {
        console.error("[cron/collect] playlistItems failed", ch.id, err);
      }
    }

    // 4) 영상 상세 batch
    const videos = await getVideoDetailsBatch(allVideoIds, videoToChannel, quota);
    await upsertVideos(videos);
    processedVideos = videos.length;

    await finishLog(logId, "success", {
      channels: processedChannels,
      videos: processedVideos,
      quota: quota.total,
    });
    return NextResponse.json({
      ok: true,
      channels: processedChannels,
      videos: processedVideos,
      quota: quota.total,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[cron/collect] fatal", msg);
    await finishLog(logId, "failed", {
      channels: processedChannels,
      videos: processedVideos,
      quota: quota.total,
      error: msg,
    });
    return NextResponse.json({ error: msg, quota: quota.total }, { status: 500 });
  }
}
