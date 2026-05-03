// 사용자 정의 채널 태그 (localStorage)
// 데이터 구조: { [channelId]: string[] }

const KEY = "yt_channel_tags_v1";
const MAX_TAG_LEN = 16;
const MAX_TAGS_PER_CHANNEL = 8;

type TagMap = Record<string, string[]>;

function read(): TagMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as TagMap;
  } catch {
    return {};
  }
}

function write(map: TagMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
    window.dispatchEvent(new CustomEvent("yt-channel-tags-changed"));
  } catch {
    /* quota exceeded */
  }
}

export function normalizeTag(input: string): string {
  return input.trim().slice(0, MAX_TAG_LEN);
}

export function getTags(channelId: string): string[] {
  return read()[channelId] || [];
}

export function getAllTagsMap(): TagMap {
  return read();
}

export function getAllUniqueTags(): string[] {
  const all = read();
  const set = new Set<string>();
  for (const tags of Object.values(all)) {
    for (const t of tags) set.add(t);
  }
  return [...set].sort((a, b) => a.localeCompare(b, "ko"));
}

export function getTagCounts(): Map<string, number> {
  const counts = new Map<string, number>();
  const all = read();
  for (const tags of Object.values(all)) {
    for (const t of tags) counts.set(t, (counts.get(t) || 0) + 1);
  }
  return counts;
}

export function addTag(channelId: string, tag: string): void {
  const t = normalizeTag(tag);
  if (!t) return;
  const map = read();
  const cur = map[channelId] || [];
  if (cur.includes(t)) return;
  if (cur.length >= MAX_TAGS_PER_CHANNEL) return;
  map[channelId] = [...cur, t];
  write(map);
}

export function removeTag(channelId: string, tag: string): void {
  const map = read();
  const cur = map[channelId];
  if (!cur) return;
  const next = cur.filter((x) => x !== tag);
  if (next.length === cur.length) return;
  if (next.length === 0) {
    delete map[channelId];
  } else {
    map[channelId] = next;
  }
  write(map);
}

export function toggleTag(channelId: string, tag: string): void {
  const t = normalizeTag(tag);
  if (!t) return;
  const cur = getTags(channelId);
  if (cur.includes(t)) removeTag(channelId, t);
  else addTag(channelId, t);
}

export function renameTag(oldName: string, newName: string): void {
  const t = normalizeTag(newName);
  if (!t || t === oldName) return;
  const map = read();
  for (const ch of Object.keys(map)) {
    const idx = map[ch].indexOf(oldName);
    if (idx >= 0) {
      map[ch] = [...new Set([...map[ch].slice(0, idx), t, ...map[ch].slice(idx + 1)])];
    }
  }
  write(map);
}

export function deleteTagGlobally(tag: string): void {
  const map = read();
  for (const ch of Object.keys(map)) {
    if (map[ch].includes(tag)) {
      map[ch] = map[ch].filter((x) => x !== tag);
      if (map[ch].length === 0) delete map[ch];
    }
  }
  write(map);
}

// React 훅에서 변경 감지용 — yt-channel-tags-changed 이벤트
export const TAGS_CHANGED_EVENT = "yt-channel-tags-changed";
