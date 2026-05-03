"use client";

import { useState, useEffect, useRef } from "react";
import { changelog } from "@/data/changelog";

export default function ChangelogBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const lastSeen = localStorage.getItem("yt_changelog_seen");
    const latestDate = changelog[0]?.date;
    if (latestDate && lastSeen !== latestDate) {
      setHasNew(true);
    }
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleOpen = () => {
    setIsOpen((v) => !v);
    if (hasNew) {
      setHasNew(false);
      localStorage.setItem("yt_changelog_seen", changelog[0]?.date || "");
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {hasNew && (
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-[#0a0a0f]" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl sm:w-80">
          <h3 className="mb-3 text-sm font-semibold text-white">업데이트 소식</h3>
          <div className="max-h-80 space-y-4 overflow-y-auto">
            {changelog.map((entry) => (
              <div key={entry.date}>
                <div className="mb-1.5 text-xs font-semibold text-[#00e5a0]">{entry.date}</div>
                <ul className="space-y-1">
                  {entry.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-zinc-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
