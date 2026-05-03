"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TAGS_CHANGED_EVENT, getAllTagsMap, removeTag } from "@/lib/channelTags";

type ChannelLite = {
  id: string;
  name: string;
  thumbnail: string;
};

function loadChannelLite(id: string): ChannelLite | null {
  // 1) 상세 캐시 우선
  try {
    const raw = localStorage.getItem(`yt_channel_v2_${id}`);
    if (raw) {
      const { channel } = JSON.parse(raw);
      if (channel?.name) {
        return { id, name: channel.name, thumbnail: channel.thumbnail || "" };
      }
    }
  } catch {
    /* ignore */
  }
  // 2) 핸들 조회 이력
  try {
    const raw = localStorage.getItem("yt_lookup_history");
    if (raw) {
      const items = JSON.parse(raw) as { id: string; name: string; thumbnail?: string }[];
      const found = items.find((h) => h.id === id);
      if (found) return { id, name: found.name, thumbnail: found.thumbnail || "" };
    }
  } catch {
    /* ignore */
  }
  // 3) 전체 채널 캐시
  try {
    const raw = localStorage.getItem("yt_all_channels");
    if (raw) {
      const items = JSON.parse(raw) as { id: string; name: string; thumbnail?: string }[];
      const found = items.find((c) => c.id === id);
      if (found) return { id, name: found.name, thumbnail: found.thumbnail || "" };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export default function TaggedChannels() {
  const [tagMap, setTagMap] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const sync = () => setTagMap(getAllTagsMap());
    sync();
    window.addEventListener(TAGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, sync);
  }, []);

  // tag → channelIds[]
  const grouped = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const [chId, tags] of Object.entries(tagMap)) {
      for (const t of tags) {
        const arr = m.get(t) || [];
        arr.push(chId);
        m.set(t, arr);
      }
    }
    return [...m.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [tagMap]);

  const totalChannels = Object.keys(tagMap).length;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-base">🏷️</span>
        <h3 className="text-sm font-semibold text-zinc-300">태그별 채널</h3>
        {totalChannels > 0 && (
          <span className="rounded-full bg-[#06b6d4]/20 px-1.5 py-0.5 text-[10px] font-bold text-[#06b6d4]">
            {totalChannels}
          </span>
        )}
      </div>

      {grouped.length === 0 ? (
        <p className="text-xs text-zinc-500">
          아직 태그를 붙인 채널이 없어요. 채널 카드의 <span className="text-zinc-300">+ 태그</span> 버튼으로 분류를 시작해보세요.
        </p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([tag, chIds]) => (
            <div key={tag}>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-[#06b6d4]/15 px-2.5 py-0.5 text-xs font-bold text-[#06b6d4]">
                  {tag}
                </span>
                <span className="text-[10px] text-zinc-400">{chIds.length}개</span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {chIds.map((id) => {
                  const lite = loadChannelLite(id);
                  return (
                    <div
                      key={`${tag}-${id}`}
                      className="group flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] p-2.5 transition-colors hover:border-[#06b6d4]/20 hover:bg-white/[0.06]"
                    >
                      {lite?.thumbnail ? (
                        <img
                          src={lite.thumbnail}
                          alt={lite.name}
                          className="h-9 w-9 rounded-full object-cover ring-1 ring-white/10"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#06b6d4] to-[#00e5a0] text-xs font-bold text-white">
                          {(lite?.name || id).charAt(0)}
                        </div>
                      )}
                      <Link
                        href={`/channel/${id}`}
                        className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-200 hover:text-[#06b6d4]"
                      >
                        {lite?.name || id}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (confirm(`'${tag}' 태그를 이 채널에서 제거하시겠어요?`)) {
                            removeTag(id, tag);
                          }
                        }}
                        className="text-[10px] text-zinc-500 opacity-0 transition-all hover:text-red-400 group-hover:opacity-100"
                        title="이 채널에서 태그 제거"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
