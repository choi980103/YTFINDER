// 분당 제한
const requests = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 60 * 1000; // 1분
const MAX_REQUESTS = 10; // 1분당 최대 10회

// 일일 제한
const dailyRequests = new Map<string, { count: number; resetTime: number }>();
const DAILY_WINDOW_MS = 24 * 60 * 60 * 1000; // 24시간
const MAX_DAILY_REQUESTS = 200; // 하루 최대 200회

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();

  // 일일 제한 확인
  const daily = dailyRequests.get(ip);
  if (daily && now <= daily.resetTime) {
    if (daily.count >= MAX_DAILY_REQUESTS) {
      return { allowed: false, remaining: 0 };
    }
  }

  // 분당 제한 확인
  const entry = requests.get(ip);
  if (entry && now <= entry.resetTime && entry.count >= MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  // 분당 카운트 업데이트
  if (!entry || now > entry.resetTime) {
    requests.set(ip, { count: 1, resetTime: now + WINDOW_MS });
  } else {
    entry.count++;
  }

  // 일일 카운트 업데이트
  if (!daily || now > daily.resetTime) {
    dailyRequests.set(ip, { count: 1, resetTime: now + DAILY_WINDOW_MS });
  } else {
    daily.count++;
  }

  // 메모리 관리: 만료된 항목 정리
  if (requests.size > 5000) {
    for (const [k, v] of requests) {
      if (now > v.resetTime) requests.delete(k);
    }
  }
  if (dailyRequests.size > 5000) {
    for (const [k, v] of dailyRequests) {
      if (now > v.resetTime) dailyRequests.delete(k);
    }
  }

  const remaining = MAX_REQUESTS - (requests.get(ip)?.count || 0);
  return { allowed: true, remaining };
}
