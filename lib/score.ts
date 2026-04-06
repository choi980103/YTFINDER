import { Channel } from "@/data/mockChannels";

/**
 * 떡상 지수 (0 ~ 100)
 * - 조회/구독 비율: 최대 50점
 * - 성장률: 최대 30점
 * - 최근 활동량(영상 수): 최대 20점
 */
export function calculateScore(ch: Channel): number {
  const ratioScore = Math.min(ch.viewToSubRatio / 40, 1) * 50;
  const growthScore = Math.min(ch.growthRate / 500, 1) * 30;
  const activityScore = Math.min(ch.recentVideos / 10, 1) * 20;
  return Math.round(ratioScore + growthScore + activityScore);
}

export type ScoreTier = "S" | "A" | "B" | "C" | "D";

export function getScoreTier(score: number): ScoreTier {
  if (score >= 80) return "S";
  if (score >= 60) return "A";
  if (score >= 40) return "B";
  if (score >= 20) return "C";
  return "D";
}

export function getScoreLabel(tier: ScoreTier): string {
  switch (tier) {
    case "S": return "떡상 임박";
    case "A": return "고성장";
    case "B": return "성장 중";
    case "C": return "보통";
    case "D": return "관찰 필요";
  }
}

export function getScoreColor(tier: ScoreTier): string {
  switch (tier) {
    case "S": return "text-[#00e5a0]";
    case "A": return "text-[#06b6d4]";
    case "B": return "text-amber-400";
    case "C": return "text-zinc-400";
    case "D": return "text-zinc-600";
  }
}

export function getScoreBg(tier: ScoreTier): string {
  switch (tier) {
    case "S": return "bg-[#00e5a0]/10 border-[#00e5a0]/30";
    case "A": return "bg-[#06b6d4]/10 border-[#06b6d4]/30";
    case "B": return "bg-amber-400/10 border-amber-400/30";
    case "C": return "bg-zinc-400/10 border-zinc-400/30";
    case "D": return "bg-zinc-600/10 border-zinc-600/30";
  }
}

export function getScoreGradient(tier: ScoreTier): string {
  switch (tier) {
    case "S": return "from-[#00e5a0] to-[#06b6d4]";
    case "A": return "from-[#06b6d4] to-[#818cf8]";
    case "B": return "from-amber-400 to-orange-500";
    case "C": return "from-zinc-400 to-zinc-500";
    case "D": return "from-zinc-600 to-zinc-700";
  }
}
