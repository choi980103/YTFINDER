import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidApiKey, isValidChannelId } from "@/lib/validate";
import { verifyAccess } from "@/lib/verifyAccess";

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

export async function POST(request: NextRequest) {
  try {
    const denied = verifyAccess(request);
    if (denied) return denied;

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const { apiKey, channelId: rawChannelId, handle } = await request.json();

    if (!apiKey || (!rawChannelId && !handle)) {
      return NextResponse.json(
        { error: "API 키와 채널 ID 또는 핸들이 필요합니다" },
        { status: 400 }
      );
    }

    if (!isValidApiKey(apiKey)) {
      return NextResponse.json({ error: "API 키 형식이 올바르지 않습니다." }, { status: 400 });
    }

    // @핸들로 채널 ID 조회 (1유닛)
    let channelId = rawChannelId;
    if (!channelId && handle) {
      const handleRes = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@${encodeURIComponent(handle)}&key=${apiKey}`
      );
      if (handleRes.ok) {
        const handleData = await handleRes.json();
        if (handleData.items && handleData.items.length > 0) {
          channelId = handleData.items[0].id;
        }
      }
      if (!channelId) {
        return NextResponse.json({ error: "해당 핸들의 채널을 찾을 수 없습니다." }, { status: 404 });
      }
    }

    if (!isValidChannelId(channelId)) {
      return NextResponse.json({ error: "채널 ID 형식이 올바르지 않습니다." }, { status: 400 });
    }

    // 1. 채널 상세 정보 (1유닛)
    const chRes = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails,brandingSettings&id=${channelId}&key=${apiKey}`
    );
    if (!chRes.ok) {
      const err = await chRes.json();
      throw new Error(err.error?.message || "채널 정보 요청 실패");
    }
    const chData = await chRes.json();
    const ch = chData.items?.[0];
    if (!ch) {
      return NextResponse.json({ error: "채널을 찾을 수 없습니다" }, { status: 404 });
    }

    // 2. 최근 영상 목록 (페이지네이션으로 최대 300개)
    const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
    let recentVideos: { id: string; title: string; thumbnail: string; publishedAt: string; views: number; likes: number; duration: number; isShort: boolean }[] = [];

    if (uploadsId) {
      // 페이지네이션으로 영상 ID 수집 (최대 300개, 6번 호출)
      const allVideoIds: string[] = [];
      let nextPageToken: string | undefined;
      const MAX_VIDEOS = 300;

      while (allVideoIds.length < MAX_VIDEOS) {
        const pageParam = nextPageToken ? `&pageToken=${nextPageToken}` : "";
        const plRes = await fetch(
          `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsId}&maxResults=50${pageParam}&key=${apiKey}`
        );
        if (!plRes.ok) break;
        const plData = await plRes.json();
        const ids = plData.items?.map(
          (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
        ) || [];
        allVideoIds.push(...ids);
        nextPageToken = plData.nextPageToken;
        if (!nextPageToken) break;
      }

      // 영상 상세 (50개씩 나눠서 호출)
      for (let i = 0; i < allVideoIds.length; i += 50) {
        const batch = allVideoIds.slice(i, i + 50);
        const vRes = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${batch.join(",")}&key=${apiKey}`
        );
        if (!vRes.ok) continue;
        const vData = await vRes.json();
        const videos = (vData.items || []).map(
          (v: {
            id: string;
            snippet: { title: string; thumbnails: { medium?: { url: string } }; publishedAt: string };
            statistics: { viewCount: string; likeCount: string };
            contentDetails: { duration: string };
          }) => {
            const dur = parseDuration(v.contentDetails.duration);
            return {
              id: v.id,
              title: v.snippet.title,
              thumbnail: v.snippet.thumbnails?.medium?.url || "",
              publishedAt: v.snippet.publishedAt,
              views: parseInt(v.statistics.viewCount || "0", 10),
              likes: parseInt(v.statistics.likeCount || "0", 10),
              duration: dur,
              isShort: dur <= 60,
            };
          }
        );
        recentVideos.push(...videos);
      }
    }
    return NextResponse.json({
      channel: {
        id: ch.id,
        name: ch.snippet.title,
        description: ch.snippet.description || "",
        thumbnail: ch.snippet.thumbnails?.medium?.url || "",
        banner: ch.brandingSettings?.image?.bannerExternalUrl || "",
        subscribers: parseInt(ch.statistics.subscriberCount || "0", 10),
        totalViews: parseInt(ch.statistics.viewCount || "0", 10),
        videoCount: parseInt(ch.statistics.videoCount || "0", 10),
        createdAt: ch.snippet.publishedAt || "",
        country: ch.snippet.country || "",
      },
      recentVideos,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
