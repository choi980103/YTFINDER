"use client";

import { useMemo } from "react";
import { Channel } from "@/data/mockChannels";
import { calculateScore } from "@/lib/score";

// 불용어 — 영상 제목에서 의미없는 것들만 간결하게
const STOP_WORDS = new Set([
  // 한국어 조사/어미
  "의", "가", "이", "은", "는", "을", "를", "에", "와", "과", "도", "로",
  "으로", "에서", "까지", "부터", "만", "보다", "하는", "하고", "한", "된",
  "있는", "없는", "그", "저", "것", "수", "등", "중", "더", "또", "너무",
  "진짜", "레알", "ㅋㅋ", "ㅎㅎ", "ㅠㅠ",
  // 유튜브 쇼츠 흔한 단어
  "shorts", "short", "쇼츠", "숏츠", "영상", "part", "episode", "vol",
  // 영어 일반
  "the", "a", "an", "and", "or", "in", "on", "at", "to", "for",
  "of", "with", "is", "are", "was", "this", "that", "it", "my",
  "you", "your", "how", "what", "when", "who", "why", "not", "but",
  "just", "like", "from", "all", "very", "so", "too", "can",
]);

function isMeaningless(word: string): boolean {
  if (/^\d+$/.test(word)) return true;
  if (/^[a-z]{1,2}$/.test(word)) return true;
  if (/^[가-힣]$/.test(word)) return true;
  if (/^#/.test(word)) return true;
  return false;
}

interface KeywordEntry {
  word: string;
  score: number;
  count: number;
}

function extractFromTitles(channels: Channel[]): KeywordEntry[] {
  const wordScores = new Map<string, { totalScore: number; count: number }>();
  const totalChannels = channels.length;

  for (const ch of channels) {
    const chScore = calculateScore(ch);
    const weight = 1 + chScore / 50; // 고성과 채널 가중 (1~3배)

    // 영상 제목 사용 (없으면 채널명+설명 fallback)
    const titles = ch.videoTitles && ch.videoTitles.length > 0
      ? ch.videoTitles
      : [ch.name, ch.description];

    const allText = titles.join(" ").toLowerCase();

    // 해시태그 제거, 특수문자 정리
    const cleaned = allText
      .replace(/#\S+/g, "")
      .replace(/[|｜\[\]【】《》「」『』()\-_~…·•]/g, " ");

    // 단어 추출 (한글 2글자+, 영어 3글자+)
    const words = cleaned.match(/[가-힣]{2,}|[a-z]{3,}/g) || [];
    const meaningful = words.filter(
      (w) => !STOP_WORDS.has(w) && !isMeaningless(w)
    );

    // 바이그램 생성
    const bigrams: string[] = [];
    for (let i = 0; i < meaningful.length - 1; i++) {
      // 같은 제목 내 연속 단어만 바이그램으로
      bigrams.push(`${meaningful[i]} ${meaningful[i + 1]}`);
    }

    // 채널당 한 번만 카운트
    const seen = new Set<string>();
    for (const w of [...meaningful, ...bigrams]) {
      if (seen.has(w)) continue;
      seen.add(w);

      const entry = wordScores.get(w) || { totalScore: 0, count: 0 };
      entry.totalScore += weight;
      entry.count += 1;
      wordScores.set(w, entry);
    }
  }

  // 최소 2개 채널에서 등장 + 80% 이상이면 제외
  const maxChannels = Math.max(totalChannels * 0.8, 4);

  return [...wordScores.entries()]
    .filter(([, v]) => v.count >= 2 && v.count <= maxChannels)
    .map(([word, v]) => ({
      word,
      score: v.totalScore,
      count: v.count,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 12);
}

interface KeywordCloudProps {
  channels: Channel[];
}

export default function KeywordCloud({ channels }: KeywordCloudProps) {
  const keywords = useMemo(() => extractFromTitles(channels), [channels]);

  if (keywords.length === 0) return null;

  const maxScore = keywords[0].score;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
      <div className="mb-3 flex items-center gap-2">
        <svg className="h-4 w-4 text-[#00e5a0]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
        </svg>
        <h3 className="text-sm font-semibold text-zinc-300">핫 콘텐츠 키워드</h3>
        <span className="text-[10px] text-zinc-600">인기 쇼츠 영상 제목에서 추출</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {keywords.map(({ word, score, count }) => {
          const intensity = score / maxScore;
          const isHot = intensity > 0.7;
          const isMedium = intensity > 0.4;

          const size = isHot
            ? "text-sm px-3.5 py-1.5"
            : isMedium
              ? "text-xs px-3 py-1"
              : "text-[11px] px-2.5 py-1";

          const color = isHot
            ? "border-[#00e5a0]/30 text-[#00e5a0]"
            : isMedium
              ? "border-[#06b6d4]/20 text-[#06b6d4]"
              : "border-white/10 text-zinc-400";

          const bg = isHot
            ? "bg-[#00e5a0]/8"
            : isMedium
              ? "bg-[#06b6d4]/5"
              : "bg-white/[0.02]";

          return (
            <span
              key={word}
              className={`cursor-default rounded-full border font-medium transition-all hover:scale-105 ${size} ${color} ${bg}`}
              title={`${count}개 채널의 영상에서 발견`}
            >
              {word}
              <span className="ml-1.5 opacity-50 text-[9px]">{count}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
