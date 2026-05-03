"use client";

import { useEffect, useState } from "react";
import { TAGS_CHANGED_EVENT, getTagCounts } from "@/lib/channelTags";

export default function TagFilterChips({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (tags: string[]) => void;
}) {
  const [tagCounts, setTagCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const sync = () => setTagCounts(getTagCounts());
    sync();
    window.addEventListener(TAGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, sync);
  }, []);

  if (tagCounts.size === 0) return null;

  const sorted = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);

  const toggle = (tag: string) => {
    if (selected.includes(tag)) onChange(selected.filter((t) => t !== tag));
    else onChange([...selected, tag]);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
        내 태그
      </span>
      {sorted.map(([tag, count]) => {
        const active = selected.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => toggle(tag)}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors ${
              active
                ? "border-[#06b6d4]/40 bg-[#06b6d4]/15 text-[#06b6d4]"
                : "border-white/10 bg-white/[0.03] text-zinc-300 hover:border-[#06b6d4]/20 hover:text-[#06b6d4]"
            }`}
          >
            {tag}
            <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-[#06b6d4]/20" : "bg-white/5"}`}>
              {count}
            </span>
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-[11px] text-zinc-400 underline decoration-dotted underline-offset-2 hover:text-zinc-300"
        >
          태그 필터 해제
        </button>
      )}
    </div>
  );
}
