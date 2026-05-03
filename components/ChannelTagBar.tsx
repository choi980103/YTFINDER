"use client";

import { useEffect, useRef, useState } from "react";
import {
  TAGS_CHANGED_EVENT,
  addTag,
  getAllUniqueTags,
  getTags,
  normalizeTag,
  removeTag,
  toggleTag,
} from "@/lib/channelTags";

export default function ChannelTagBar({ channelId }: { channelId: string }) {
  const [tags, setTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const popoverRef = useRef<HTMLDivElement | null>(null);

  // 초기 로드 + 변경 감지
  useEffect(() => {
    const sync = () => {
      setTags(getTags(channelId));
      setAllTags(getAllUniqueTags());
    };
    sync();
    window.addEventListener(TAGS_CHANGED_EVENT, sync);
    return () => window.removeEventListener(TAGS_CHANGED_EVENT, sync);
  }, [channelId]);

  // 외부 클릭 시 popover 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const stop = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const submitNew = () => {
    const t = normalizeTag(input);
    if (!t) return;
    addTag(channelId, t);
    setInput("");
  };

  const suggestions = allTags.filter(
    (t) => !tags.includes(t) && (input === "" || t.toLowerCase().includes(input.toLowerCase()))
  );

  return (
    <div className="relative mt-2 flex flex-wrap items-center gap-1.5" onClick={stop}>
      {tags.map((t) => (
        <span
          key={t}
          className="group/tag inline-flex items-center gap-1 rounded-full bg-[#06b6d4]/10 px-2 py-0.5 text-[10px] font-semibold text-[#06b6d4]"
        >
          {t}
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              removeTag(channelId, t);
            }}
            className="text-[#06b6d4]/60 hover:text-[#06b6d4]"
            title="태그 제거"
          >
            ×
          </button>
        </span>
      ))}

      <button
        type="button"
        onClick={(e) => {
          stop(e);
          setOpen((v) => !v);
        }}
        className={`inline-flex items-center gap-0.5 rounded-full border border-dashed px-2 py-0.5 text-[10px] font-semibold transition-colors ${
          open
            ? "border-[#06b6d4]/50 bg-[#06b6d4]/10 text-[#06b6d4]"
            : "border-white/15 text-zinc-400 hover:border-[#06b6d4]/30 hover:text-[#06b6d4]"
        }`}
      >
        + 태그
      </button>

      {open && (
        <div
          ref={popoverRef}
          className="absolute left-0 top-full z-30 mt-1.5 w-60 rounded-xl border border-white/10 bg-zinc-900 p-3 shadow-2xl"
        >
          <div className="flex items-center gap-1.5">
            <input
              autoFocus
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitNew();
                }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="태그 이름..."
              className="flex-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 text-xs text-zinc-200 outline-none focus:border-[#06b6d4]/40"
              maxLength={16}
            />
            <button
              type="button"
              onClick={submitNew}
              disabled={!input.trim()}
              className="rounded-md bg-[#06b6d4]/15 px-2 py-1 text-xs font-bold text-[#06b6d4] hover:bg-[#06b6d4]/25 disabled:opacity-40"
            >
              추가
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="mt-2.5">
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                기존 태그
              </div>
              <div className="flex max-h-32 flex-wrap gap-1 overflow-y-auto">
                {suggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(channelId, t)}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-zinc-300 hover:border-[#06b6d4]/30 hover:bg-[#06b6d4]/10 hover:text-[#06b6d4]"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            </div>
          )}

          {tags.length === 0 && allTags.length === 0 && (
            <p className="mt-2 text-[10px] text-zinc-400">
              예: 운동, 먹방, 벤치마크, 주의해서 볼 것 등
            </p>
          )}
        </div>
      )}
    </div>
  );
}
