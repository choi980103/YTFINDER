// 사전 수집 시스템 헬퍼
// - YouTube API 호출 + quota 카운터
// - Supabase upsert
// - cron 인증 검증

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// ─── 인증 ────────────────────────────────────────────────────────────────────
export function verifyCronRequest(req: NextRequest): NextResponse | null {
  const auth = req.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  return null;
}

// ─── quota 카운터 ────────────────────────────────────────────────────────────
export class QuotaCounter {
  private used = 0;
  add(n: number) {
    this.used += n;
  }
  get total() {
    return this.used;
  }
}

// ─── YouTube API 호출 ────────────────────────────────────────────────────────

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

export type RawChannel = {
  id: string;
  name: string;
  handle?: string;
  thumbnail: string;
  description: string;
  country?: string;
  channelCreatedAt?: string;
  subscribers: number;
  totalViews: number;
  videoCount: number;
  hiddenSubscriberCount: boolean;
  uploadsPlaylistId?: string;
};

export type RawVideo = {
  id: string;
  channelId: string;
  title: string;
  thumbnail: string;
  publishedAt: string;
  durationSeconds: number;
  isShort: boolean;
  views: number;
  likes: number;
  comments: number;
  categoryId?: string;
};

// [100유닛] 검색 — 신규 채널 발굴용
export async function searchShortsChannels(
  query: string,
  quota: QuotaCounter
): Promise<{ channelId: string; title: string }[]> {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY 미설정");
  const publishedAfter = new Date();
  publishedAfter.setMonth(publishedAfter.getMonth() - 3);
  const url =
    `https://www.googleapis.com/youtube/v3/search?part=id,snippet&q=${encodeURIComponent(query)}` +
    `&type=video&videoDuration=short&order=viewCount&regionCode=KR&relevanceLanguage=ko` +
    `&publishedAfter=${publishedAfter.toISOString()}&maxResults=50&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  quota.add(100);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`search.list 실패: ${err?.error?.message || res.statusText}`);
  }
  const data = await res.json();
  const seen = new Map<string, string>();
  for (const item of (data.items || []) as { snippet?: { channelId: string; channelTitle: string } }[]) {
    const chId = item.snippet?.channelId;
    if (chId && !seen.has(chId)) seen.set(chId, item.snippet!.channelTitle);
  }
  return [...seen.entries()].map(([channelId, title]) => ({ channelId, title }));
}

// [1유닛/요청] 채널 통계 batch (최대 50개씩)
export async function getChannelStatsBatch(
  channelIds: string[],
  quota: QuotaCounter
): Promise<RawChannel[]> {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY 미설정");
  if (channelIds.length === 0) return [];
  const result: RawChannel[] = [];
  for (let i = 0; i < channelIds.length; i += 50) {
    const ids = channelIds.slice(i, i + 50);
    const url =
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails` +
      `&id=${ids.join(",")}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    quota.add(1);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`channels.list 실패: ${err?.error?.message || res.statusText}`);
    }
    const data = await res.json();
    for (const ch of (data.items || []) as {
      id: string;
      snippet: {
        title: string;
        description?: string;
        country?: string;
        publishedAt?: string;
        customUrl?: string;
        thumbnails?: { medium?: { url: string }; default?: { url: string } };
      };
      statistics: {
        subscriberCount?: string;
        viewCount?: string;
        videoCount?: string;
        hiddenSubscriberCount?: boolean;
      };
      contentDetails?: { relatedPlaylists?: { uploads?: string } };
    }[]) {
      result.push({
        id: ch.id,
        name: ch.snippet.title,
        handle: ch.snippet.customUrl,
        thumbnail:
          ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url || "",
        description: (ch.snippet.description || "").slice(0, 500),
        country: ch.snippet.country,
        channelCreatedAt: ch.snippet.publishedAt,
        subscribers: parseInt(ch.statistics.subscriberCount || "0", 10),
        totalViews: parseInt(ch.statistics.viewCount || "0", 10),
        videoCount: parseInt(ch.statistics.videoCount || "0", 10),
        hiddenSubscriberCount: !!ch.statistics.hiddenSubscriberCount,
        uploadsPlaylistId: ch.contentDetails?.relatedPlaylists?.uploads,
      });
    }
  }
  return result;
}

// [1유닛] 채널의 최근 영상 ID
export async function getRecentVideoIds(
  uploadsPlaylistId: string,
  maxResults: number,
  quota: QuotaCounter
): Promise<string[]> {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY 미설정");
  const url =
    `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails` +
    `&playlistId=${uploadsPlaylistId}&maxResults=${Math.min(maxResults, 50)}&key=${YOUTUBE_API_KEY}`;
  const res = await fetch(url);
  quota.add(1);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.items || []).map(
    (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
  );
}

type VideoApiItem = {
  id: string;
  snippet: {
    title: string;
    publishedAt: string;
    channelId: string;
    categoryId?: string;
    thumbnails?: { medium?: { url: string }; default?: { url: string } };
  };
  contentDetails: { duration: string };
  statistics: { viewCount?: string; likeCount?: string; commentCount?: string };
};

// [1유닛/요청] 영상 상세 batch — 50개씩 chunk + 8개 chunk씩 병렬
export async function getVideoDetailsBatch(
  videoIds: string[],
  channelIdMap: Map<string, string>,
  quota: QuotaCounter
): Promise<RawVideo[]> {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY 미설정");
  if (videoIds.length === 0) return [];

  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    chunks.push(videoIds.slice(i, i + 50));
  }

  const result: RawVideo[] = [];
  for (let bi = 0; bi < chunks.length; bi += 8) {
    const slice = chunks.slice(bi, bi + 8);
    const responses = await Promise.all(
      slice.map(async (ids) => {
        const url =
          `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics` +
          `&id=${ids.join(",")}&key=${YOUTUBE_API_KEY}`;
        const res = await fetch(url);
        quota.add(1);
        if (!res.ok) return null;
        return res.json() as Promise<{ items?: VideoApiItem[] }>;
      })
    );

    for (const data of responses) {
      if (!data) continue;
      for (const v of data.items || []) {
        const dur = parseDuration(v.contentDetails.duration);
        result.push({
          id: v.id,
          channelId: v.snippet.channelId || channelIdMap.get(v.id) || "",
          title: v.snippet.title,
          thumbnail:
            v.snippet.thumbnails?.medium?.url || v.snippet.thumbnails?.default?.url || "",
          publishedAt: v.snippet.publishedAt,
          durationSeconds: dur,
          isShort: dur > 0 && dur <= 60,
          views: parseInt(v.statistics.viewCount || "0", 10),
          likes: parseInt(v.statistics.likeCount || "0", 10),
          comments: parseInt(v.statistics.commentCount || "0", 10),
          categoryId: v.snippet.categoryId,
        });
      }
    }
  }
  return result;
}

// ─── DB Upsert ──────────────────────────────────────────────────────────────

export async function upsertChannels(channels: RawChannel[]): Promise<void> {
  if (channels.length === 0) return;
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin 미설정");
  const now = new Date().toISOString();
  const rows = channels.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle || null,
    thumbnail: c.thumbnail,
    description: c.description,
    country: c.country || null,
    channel_created_at: c.channelCreatedAt || null,
    subscribers: c.subscribers,
    total_views: c.totalViews,
    video_count: c.videoCount,
    hidden_subscriber_count: c.hiddenSubscriberCount,
    last_collected_at: now,
    is_active: true,
  }));
  // upsert: id 있으면 update, 없으면 insert
  const { error } = await admin.from("channels").upsert(rows, { onConflict: "id" });
  if (error) throw new Error(`channels upsert: ${error.message}`);
}

export async function insertSnapshots(channels: RawChannel[]): Promise<void> {
  if (channels.length === 0) return;
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin 미설정");
  const now = new Date().toISOString();
  const rows = channels.map((c) => ({
    channel_id: c.id,
    collected_at: now,
    subscribers: c.subscribers,
    total_views: c.totalViews,
    video_count: c.videoCount,
  }));
  const { error } = await admin.from("channel_snapshots").insert(rows);
  // 동일 (channel_id, collected_at) 중복은 무시
  if (error && !error.message.includes("duplicate")) {
    throw new Error(`snapshots insert: ${error.message}`);
  }
}

export async function upsertVideos(videos: RawVideo[]): Promise<void> {
  if (videos.length === 0) return;
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin 미설정");
  const now = new Date().toISOString();
  const rows = videos.map((v) => ({
    id: v.id,
    channel_id: v.channelId,
    title: v.title,
    thumbnail: v.thumbnail,
    published_at: v.publishedAt,
    duration_seconds: v.durationSeconds,
    is_short: v.isShort,
    views: v.views,
    likes: v.likes,
    comments: v.comments,
    category_id: v.categoryId || null,
    updated_at: now,
  }));
  // 50개씩 잘라서 upsert (Supabase 한 번에 너무 많으면 timeout 위험)
  for (let i = 0; i < rows.length; i += 200) {
    const chunk = rows.slice(i, i + 200);
    const { error } = await admin.from("videos").upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`videos upsert: ${error.message}`);
  }
}

// ─── 로그 ───────────────────────────────────────────────────────────────────

export async function startLog(jobType: string): Promise<number | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  const { data, error } = await admin
    .from("collection_logs")
    .insert({ job_type: jobType, status: "running" })
    .select("id")
    .single();
  if (error) return null;
  return data.id as number;
}

export async function finishLog(
  id: number | null,
  status: "success" | "failed",
  meta: { channels?: number; videos?: number; quota?: number; error?: string }
): Promise<void> {
  if (id === null) return;
  const admin = getSupabaseAdmin();
  if (!admin) return;
  await admin
    .from("collection_logs")
    .update({
      finished_at: new Date().toISOString(),
      status,
      channels_processed: meta.channels || 0,
      videos_processed: meta.videos || 0,
      api_units_used: meta.quota || 0,
      error_message: meta.error || null,
    })
    .eq("id", id);
}
