"use client";

import { useState, useEffect } from "react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
}

export default function ApiKeyModal({
  isOpen,
  onClose,
  onSave,
}: ApiKeyModalProps) {
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem("yt_api_key") || "";
      setKey(stored);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!key.trim()) return;
    localStorage.setItem("yt_api_key", key.trim());
    onSave(key.trim());
    setSaved(true);
    setTimeout(() => onClose(), 800);
  };

  const handleRemove = () => {
    localStorage.removeItem("yt_api_key");
    setKey("");
    onSave("");
    setSaved(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-6 shadow-2xl">
        <h3 className="text-lg font-bold text-white">YouTube API 키 설정</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Google Cloud Console에서 YouTube Data API v3 키를 발급받아 입력하세요.
          키는 브라우저에만 저장됩니다.
        </p>

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            API Key
          </label>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="AIzaSy..."
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition-all focus:border-[#00e5a0]/50 focus:ring-1 focus:ring-[#00e5a0]/20"
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
          />
        </div>

        {saved && (
          <div className="mt-3 rounded-lg bg-[#00e5a0]/10 px-3 py-2 text-xs font-medium text-[#00e5a0]">
            API 키가 저장되었습니다!
          </div>
        )}

        <div className="mt-5 flex gap-2">
          <button
            onClick={handleSave}
            disabled={!key.trim()}
            className="flex-1 rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-4 py-2.5 text-sm font-semibold text-[#0a0a0f] transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            저장 & 연동
          </button>
          {key && (
            <button
              onClick={handleRemove}
              className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              삭제
            </button>
          )}
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/10"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
