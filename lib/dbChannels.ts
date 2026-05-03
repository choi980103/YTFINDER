// DB에 수집된 채널 + 영상 데이터를 사이트의 Channel 형식으로 변환

import { getSupabaseAdmin } from "@/lib/supabase";
import type { Channel } from "@/data/mockChannels";

type ChannelRow = {
  id: string;
  name: string;
  thumbnail: string | null;
  description: string | null;
  subscribers: number;
  total_views: number;
  video_count: number;
  channel_created_at: string | null;
  region: string | null;
};

type VideoRow = {
  id: string;
  channel_id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  duration_seconds: number;
  is_short: boolean;
  published_at: string | null;
};

/**
 * DB에서 한국 쇼츠 채널 목록 + 통계 → 사이트 Channel[] 반환.
 * 채널 통계(subscribers)는 channels 테이블에서, 영상 통계는 videos 테이블 group으로.
 * limit은 결과 채널 수 (디폴트 300).
 */
export async function getShortsChannelsFromDb(
  options: { region?: string; limit?: number } = {}
): Promise<Channel[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const region = options.region || "kr";
  const limit = options.limit || 300;

  // 1) 활성 채널 (구독자 100~100만)
  const { data: chRows, error: chErr } = await admin
    .from("channels")
    .select("id,name,thumbnail,description,subscribers,total_views,video_count,channel_created_at,region")
    .eq("is_active", true)
    .eq("region", region)
    .gte("subscribers", 100)
    .lte("subscribers", 1_000_000)
    .order("subscribers", { ascending: false })
    .limit(limit * 2); // 영상 없는 채널 거를 여유분
  if (chErr || !chRows) return [];

  if (chRows.length === 0) return [];
  const channelIds = chRows.map((c) => c.id);

  // 2) 각 채널의 쇼츠 영상 (최근 30개씩만)
  const { data: vRows, error: vErr } = await admin
    .from("videos")
    .select("id,channel_id,title,views,likes,comments,duration_seconds,is_short,published_at")
    .in("channel_id", channelIds)
    .eq("is_short", true)
    .order("published_at", { ascending: false });
  if (vErr || !vRows) return [];

  // 3) 채널별로 영상 묶음
  const videosByChannel = new Map<string, VideoRow[]>();
  for (const v of vRows as VideoRow[]) {
    const arr = videosByChannel.get(v.channel_id) || [];
    arr.push(v);
    videosByChannel.set(v.channel_id, arr);
  }

  // 4) 통계 계산 + Channel 변환
  const ninetyDaysAgo = Date.now() - 90 * 24 * 3600 * 1000;
  const thirtyDaysAgo = Date.now() - 30 * 24 * 3600 * 1000;

  const result: Channel[] = [];
  for (const ch of chRows as ChannelRow[]) {
    const videos = (videosByChannel.get(ch.id) || []).slice(0, 30);
    if (videos.length === 0) continue;

    // 최근 90일 이내 업로드 없는 채널 제외 (휴면)
    const lastUpload = videos
      .map((v) => v.published_at)
      .filter((d): d is string => !!d)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];
    if (!lastUpload || new Date(lastUpload).getTime() < ninetyDaysAgo) continue;

    const views = videos.map((v) => v.views || 0);
    const totalViews = views.reduce((a, b) => a + b, 0);
    const totalLikes = videos.reduce((a, b) => a + (b.likes || 0), 0);
    const totalComments = videos.reduce((a, b) => a + (b.comments || 0), 0);
    const avgViews = Math.round(totalViews / views.length);
    if (avgViews === 0) continue;

    const viewToSubRatio = parseFloat(((avgViews / ch.subscribers) * 100).toFixed(1));
    const engagementRate =
      totalViews > 0
        ? parseFloat((((totalLikes + totalComments) / totalViews) * 100).toFixed(2))
        : 0;

    const monthlyUploads = videos.filter(
      (v) => v.published_at && new Date(v.published_at).getTime() >= thirtyDaysAgo
    ).length;

    const viewTrend = views.slice(0, 6);
    const videoTitles = videos.map((v) => v.title).filter(Boolean).slice(0, 30);

    result.push({
      id: ch.id,
      name: ch.name,
      thumbnail: ch.thumbnail || "",
      subscribers: ch.subscribers,
      avgViews,
      viewToSubRatio,
      engagementRate,
      category: "쇼츠",
      recentVideos: videos.length,
      growthRate: Math.round(viewToSubRatio), // 임시: 비율을 성장률로 (시계열 들어오면 교체)
      description: (ch.description || "").slice(0, 80),
      region: "kr",
      ...(viewTrend.length >= 2 ? { viewTrend } : {}),
      ...(ch.channel_created_at ? { createdAt: ch.channel_created_at } : {}),
      ...(videoTitles.length > 0 ? { videoTitles } : {}),
      ...(lastUpload ? { lastUploadDate: lastUpload } : {}),
      monthlyUploads,
    });
  }

  // 비율 높은 순 정렬, limit
  result.sort((a, b) => b.viewToSubRatio - a.viewToSubRatio);
  return result.slice(0, limit);
}

/**
 * Top100 영상용: DB의 최근 N일 인기 쇼츠 영상.
 */
export type DbTopVideo = {
  id: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelTitle: string;
  views: number;
  likes: number;
  comments: number;
  duration: number;
  isShort: boolean;
  publishedAt: string;
  categoryId: string;
};

export async function getTopVideosFromDb(
  options: { recentDays?: number; limit?: number } = {}
): Promise<DbTopVideo[]> {
  const admin = getSupabaseAdmin();
  if (!admin) return [];

  const recentDays = options.recentDays ?? 7;
  const limit = options.limit ?? 300;
  const since = new Date(Date.now() - recentDays * 24 * 3600 * 1000).toISOString();

  // 영상 + 채널 thumbnail/title을 join 형태로
  const { data, error } = await admin
    .from("videos")
    .select("id,channel_id,title,thumbnail,views,likes,comments,duration_seconds,is_short,published_at,category_id,channels(name,thumbnail)")
    .gte("published_at", since)
    .order("views", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  type Row = {
    id: string;
    channel_id: string;
    title: string;
    thumbnail: string | null;
    views: number;
    likes: number;
    comments: number;
    duration_seconds: number;
    is_short: boolean;
    published_at: string;
    category_id: string | null;
    channels: { name: string; thumbnail: string | null } | { name: string; thumbnail: string | null }[] | null;
  };

  return (data as Row[]).map((v) => {
    const ch = Array.isArray(v.channels) ? v.channels[0] : v.channels;
    return {
      id: v.id,
      title: v.title,
      thumbnail: v.thumbnail || "",
      channelId: v.channel_id,
      channelTitle: ch?.name || "",
      views: v.views || 0,
      likes: v.likes || 0,
      comments: v.comments || 0,
      duration: v.duration_seconds || 0,
      isShort: !!v.is_short,
      publishedAt: v.published_at,
      categoryId: v.category_id || "",
    };
  });
}
