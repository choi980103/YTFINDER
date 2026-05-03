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

  const handleResetAccessCode = () => {
    const ok = window.confirm(
      "현재 등록된 액세스 코드를 제거하고 새 코드를 입력하시겠습니까?\n\n무료 체험 → 영구권 전환 시 사용하세요.",
    );
    if (!ok) return;
    localStorage.removeItem("yt_access_code");
    window.location.reload();
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
        <h3 className="text-lg font-bold text-white">설정</h3>
        <p className="mt-1 text-xs text-zinc-400">
          YouTube API 키와 액세스 코드를 관리합니다.
        </p>

        <div className="mt-5 border-t border-white/10 pt-5">
          <h4 className="text-sm font-semibold text-zinc-200">YouTube API 키</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
            Google Cloud Console에서 YouTube Data API v3 키를 발급받아 입력하세요. 키는 브라우저에만 저장됩니다.
          </p>
        </div>

        <div className="mt-5">
          <label className="mb-1.5 block text-xs font-medium text-zinc-300">
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

        <div className="mt-4 flex gap-2">
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
        </div>

        <div className="mt-6 border-t border-white/10 pt-5">
          <h4 className="text-sm font-semibold text-zinc-200">액세스 코드</h4>
          <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
            무료 체험 → 영구권 전환 등 다른 코드를 입력하시려면 아래 버튼을 눌러주세요. 현재 코드가 제거되고 입력 화면이 다시 나타납니다.
          </p>
          <button
            onClick={handleResetAccessCode}
            className="mt-3 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            다른 액세스 코드 입력하기
          </button>
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
