import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rateLimit";
import { isValidApiKey, isValidChannelId } from "@/lib/validate";

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
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const { allowed } = checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }, { status: 429 });
    }

    const { apiKey, channelId } = await request.json();

    if (!apiKey || !channelId) {
      return NextResponse.json(
        { error: "API 키와 채널 ID가 필요합니다" },
        { status: 400 }
      );
    }

    if (!isValidApiKey(apiKey)) {
      return NextResponse.json({ error: "API 키 형식이 올바르지 않습니다." }, { status: 400 });
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

    // 2. 최근 영상 목록 (1유닛)
    const uploadsId = ch.contentDetails?.relatedPlaylists?.uploads;
    let recentVideos: { id: string; title: string; thumbnail: string; publishedAt: string; views: number; likes: number; duration: number; isShort: boolean }[] = [];

    if (uploadsId) {
      const plRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails,snippet&playlistId=${uploadsId}&maxResults=20&key=${apiKey}`
      );
      if (plRes.ok) {
        const plData = await plRes.json();
        const videoIds = plData.items?.map(
          (item: { contentDetails: { videoId: string } }) => item.contentDetails.videoId
        ) || [];

        // 3. 영상 상세 (1유닛)
        if (videoIds.length > 0) {
          const vRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${videoIds.join(",")}&key=${apiKey}`
          );
          if (vRes.ok) {
            const vData = await vRes.json();
            recentVideos = (vData.items || []).map(
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
          }
        }
      }
    }

    // 총 3유닛
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
