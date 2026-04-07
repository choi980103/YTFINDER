// YouTube API 키: 39자 영숫자 + 언더스코어/하이픈
export function isValidApiKey(key: string): boolean {
  return /^[A-Za-z0-9_-]{30,50}$/.test(key);
}

// YouTube 채널 ID: UC로 시작하는 24자
export function isValidChannelId(id: string): boolean {
  return /^UC[A-Za-z0-9_-]{22}$/.test(id);
}
