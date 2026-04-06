// 채널 비율 히스토리를 localStorage에 스냅샷으로 저장/조회

export interface ChannelSnapshot {
  viewToSubRatio: number;
  avgViews: number;
  subscribers: number;
  growthRate: number;
  score: number;
}

export interface HistoryEntry {
  timestamp: number; // Date.now()
  data: ChannelSnapshot;
}

export type ChannelHistory = Record<string, HistoryEntry[]>;

const STORAGE_KEY = "yt_channel_history";
const MAX_ENTRIES_PER_CHANNEL = 30; // 최대 30개 스냅샷
const MIN_INTERVAL = 1000 * 60 * 30; // 최소 30분 간격

function loadHistory(): ChannelHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHistory(history: ChannelHistory) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch { /* quota exceeded — ignore */ }
}

/** 채널들의 현재 상태를 스냅샷으로 저장 */
export function saveChannelSnapshots(
  channels: { id: string; viewToSubRatio: number; avgViews: number; subscribers: number; growthRate: number; score: number }[]
) {
  const history = loadHistory();
  const now = Date.now();

  for (const ch of channels) {
    const entries = history[ch.id] || [];
    const last = entries[entries.length - 1];

    // 최소 간격 체크
    if (last && now - last.timestamp < MIN_INTERVAL) continue;

    entries.push({
      timestamp: now,
      data: {
        viewToSubRatio: ch.viewToSubRatio,
        avgViews: ch.avgViews,
        subscribers: ch.subscribers,
        growthRate: ch.growthRate,
        score: ch.score,
      },
    });

    // 오래된 것 정리
    if (entries.length > MAX_ENTRIES_PER_CHANNEL) {
      entries.splice(0, entries.length - MAX_ENTRIES_PER_CHANNEL);
    }

    history[ch.id] = entries;
  }

  saveHistory(history);
}

/** 특정 채널의 히스토리 가져오기 */
export function getChannelHistory(channelId: string): HistoryEntry[] {
  const history = loadHistory();
  return history[channelId] || [];
}

/** 히스토리에서 특정 필드 추출 */
export function extractHistoryValues(
  entries: HistoryEntry[],
  field: keyof ChannelSnapshot
): { timestamp: number; value: number }[] {
  return entries.map((e) => ({
    timestamp: e.timestamp,
    value: e.data[field],
  }));
}
