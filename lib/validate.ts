// YouTube API 키: 39자 영숫자 + 언더스코어/하이픈
export function isValidApiKey(key: string): boolean {
  return /^[A-Za-z0-9_-]{30,50}$/.test(key);
}

// YouTube 채널 ID: UC로 시작하는 24자
export function isValidChannelId(id: string): boolean {
  return /^UC[A-Za-z0-9_-]{22}$/.test(id);
}

// 검색어: 길이 제한 + 제어문자 제거
export function sanitizeQuery(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (trimmed.length === 0 || trimmed.length > 100) return null;
  // eslint-disable-next-line no-control-regex
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return null;
  return trimmed;
}

// 액세스 코드: 영숫자 + 하이픈, 최대 64자
export function isValidAccessCodeFormat(code: unknown): code is string {
  return typeof code === "string" && /^[A-Za-z0-9-]{1,64}$/.test(code);
}
