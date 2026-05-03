// 서버 메모리 캐시 (TTL + LRU)
// Vercel Serverless에서는 인스턴스마다 메모리 별개라 hit rate가 완벽하진 않지만
// hot path(자주 호출되는 키)에서는 명확한 quota 절감 효과 있음.

type Entry<T> = { value: T; expiresAt: number };

export class TTLCache<T> {
  private map = new Map<string, Entry<T>>();
  constructor(
    private readonly ttlMs: number,
    private readonly maxEntries = 200
  ) {}

  get(key: string): T | null {
    const e = this.map.get(key);
    if (!e) return null;
    if (e.expiresAt < Date.now()) {
      this.map.delete(key);
      return null;
    }
    // LRU: 최근 접근 항목을 뒤로
    this.map.delete(key);
    this.map.set(key, e);
    return e.value;
  }

  set(key: string, value: T): void {
    this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.ttlMs });
    if (this.map.size > this.maxEntries) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  size(): number {
    return this.map.size;
  }
}

export function shouldSkipCache(req: Request): boolean {
  return req.headers.get("x-skip-cache") === "1";
}
