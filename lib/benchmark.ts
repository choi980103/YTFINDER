export interface BenchmarkVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channelId: string;
  channelName: string;
  views: number;
  likes: number;
  duration: number;
  isShort: boolean;
  addedAt: string;
}

const STORAGE_KEY = "yt_benchmarks";

export function getBenchmarks(): BenchmarkVideo[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addBenchmark(video: BenchmarkVideo): BenchmarkVideo[] {
  const list = getBenchmarks();
  if (list.some((v) => v.videoId === video.videoId)) return list;
  const updated = [video, ...list];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function removeBenchmark(videoId: string): BenchmarkVideo[] {
  const list = getBenchmarks().filter((v) => v.videoId !== videoId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return list;
}

export function isBenchmarked(videoId: string): boolean {
  return getBenchmarks().some((v) => v.videoId === videoId);
}
