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

// [1유닛/페이지] 채널의 최근 영상 ID — 페이지네이션 지원 (50개씩 N페이지)
export async function getRecentVideoIds(
  uploadsPlaylistId: string,
  maxResults: number,
  quota: QuotaCounter
): Promise<string[]> {
  if (!YOUTUBE_API_KEY) throw new Error("YOUTUBE_API_KEY 미설정");
  const ids: string[] = [];
  let pageToken: string | undefined;
  while (ids.length < maxResults) {
    const tokenParam = pageToken ? `&pageToken=${pageToken}` : "";
    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails` +
      `&playlistId=${uploadsPlaylistId}&maxResults=50${tokenParam}&key=${YOUTUBE_API_KEY}`;
    const res = await fetch(url);
    quota.add(1);
    if (!res.ok) break;
    const data = await res.json();
    for (const item of (data.items || []) as { contentDetails: { videoId: string } }[]) {
      if (ids.length >= maxResults) break;
      ids.push(item.contentDetails.videoId);
    }
    if (!data.nextPageToken) break;
    pageToken = data.nextPageToken;
  }
  return ids;
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

// PostgREST는 bulk upsert를 jsonb로 packing해서 PG에 넘김.
// 따라서 text 컬럼이라도 PG JSON 파서가 거부하는 문자(NULL 바이트, lone surrogate)가
// 들어있으면 "invalid input syntax for type json" 에러가 남.
// YouTube 채널명/설명에 가끔 박혀있으니 boundary에서 한 번 cleanup.
function sanitizeText(s: string | null | undefined): string | null {
  if (s == null) return null;
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (code === 0) continue; // NULL byte
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = s.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        out += s[i] + s[i + 1];
        i++;
        continue;
      }
      continue; // lone high surrogate
    }
    if (code >= 0xdc00 && code <= 0xdfff) continue; // lone low surrogate
    out += s[i];
  }
  return out;
}

function sanitizeRequired(s: string | null | undefined): string {
  return sanitizeText(s) ?? "";
}

// `markCollected` true → last_collected_at을 now로 갱신 (collect cron용)
// false → last_collected_at 안 건드림 (discover cron용 — 신규 채널은 NULL 유지해서
// collect 큐에서 우선 처리되도록)
export async function upsertChannels(
  channels: RawChannel[],
  options: { markCollected?: boolean } = {}
): Promise<void> {
  if (channels.length === 0) return;
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase admin 미설정");
  const now = new Date().toISOString();
  const rows = channels.map((c) => {
    const base = {
      id: c.id,
      name: sanitizeRequired(c.name),
      handle: sanitizeText(c.handle) || null,
      thumbnail: sanitizeRequired(c.thumbnail),
      description: sanitizeRequired(c.description),
      country: sanitizeText(c.country) || null,
      channel_created_at: c.channelCreatedAt || null,
      subscribers: c.subscribers,
      total_views: c.totalViews,
      video_count: c.videoCount,
      hidden_subscriber_count: c.hiddenSubscriberCount,
      is_active: true,
    };
    return options.markCollected ? { ...base, last_collected_at: now } : base;
  });
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
    title: sanitizeRequired(v.title),
    thumbnail: sanitizeRequired(v.thumbnail),
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
