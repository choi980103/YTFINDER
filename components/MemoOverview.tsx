"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MemoEntry {
  date: string;
  text: string;
}

interface ChannelMemo {
  channelId: string;
  channelName: string;
  memos: MemoEntry[];
}

export default function MemoOverview() {
  const [channelMemos, setChannelMemos] = useState<ChannelMemo[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      const memos = JSON.parse(localStorage.getItem("yt_memos") || "{}");
      const channels = JSON.parse(localStorage.getItem("yt_all_channels") || "[]");
      const channelMap = new Map<string, string>();
      for (const ch of channels) {
        channelMap.set(ch.id, ch.name);
      }

      const result: ChannelMemo[] = [];
      for (const [id, data] of Object.entries(memos)) {
        if (Array.isArray(data) && data.length > 0) {
          result.push({
            channelId: id,
            channelName: channelMap.get(id) || "알 수 없는 채널",
            memos: data as MemoEntry[],
          });
        }
      }
      setChannelMemos(result);
    } catch { /* ignore */ }
  }, []);

  if (channelMemos.length === 0) return null;

  const totalMemos = channelMemos.reduce((sum, ch) => sum + ch.memos.length, 0);

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-semibold text-zinc-300 transition-colors hover:text-white"
      >
        <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
        </svg>
        내 메모 모아보기
        <span className="rounded-full bg-violet-500/20 px-1.5 py-0.5 text-[10px] font-bold text-violet-400">
          {totalMemos}
        </span>
        <svg className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-3 space-y-3">
          {channelMemos.map((ch) => (
            <div key={ch.channelId} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <Link
                href={`/channel/${ch.channelId}`}
                className="mb-2 block text-sm font-semibold text-[#00e5a0] hover:underline"
              >
                {ch.channelName}
              </Link>
              <div className="space-y-1.5">
                {ch.memos.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm">
                    <span className="shrink-0 text-[11px] text-zinc-500">{m.date}</span>
                    <p className="text-zinc-300">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
