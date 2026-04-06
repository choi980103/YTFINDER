const STORAGE_KEY = "yt_recently_viewed";
const MAX_ITEMS = 10;

export interface RecentChannel {
  id: string;
  name: string;
  thumbnail: string;
  viewedAt: number;
}

export function getRecentlyViewed(): RecentChannel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addRecentlyViewed(channel: { id: string; name: string; thumbnail: string }) {
  const list = getRecentlyViewed().filter((c) => c.id !== channel.id);
  list.unshift({ ...channel, viewedAt: Date.now() });
  if (list.length > MAX_ITEMS) list.length = MAX_ITEMS;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}

export function removeRecentlyViewed(channelId: string) {
  const list = getRecentlyViewed().filter((c) => c.id !== channelId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch { /* ignore */ }
}
