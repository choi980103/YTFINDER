export interface ChangelogEntry {
  date: string;
  items: string[];
}

export const changelog: ChangelogEntry[] = [
  {
    date: "2026.04.07",
    items: [
      "영상 벤치마킹 기능 추가",
      "메모 기록이 날짜별로 쌓이도록 개선",
      "메모 & 벤치마킹 모아보기 추가",
      "참여율에 댓글 수 반영",
      "오류 발생 시 안내 메시지 및 재시도 버튼 추가",
      "업데이트 알림 기능 추가",
      "전반적인 UI 가독성 개선",
    ],
  },
];
