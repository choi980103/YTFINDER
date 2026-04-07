export interface ChangelogEntry {
  date: string;
  items: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026.04.07",
    items: [
      "벤치마킹 기능 추가",
      "메모 기록 기능 개선",
      "보안 강화 (Rate Limiting, 입력값 검증)",
      "SEO 최적화 (Open Graph 태그)",
      "커스텀 404 페이지 추가",
      "에러 메시지 개선 및 재시도 버튼",
      "참여율에 댓글 수 반영",
      "UI 가독성 개선",
    ],
  },
];
