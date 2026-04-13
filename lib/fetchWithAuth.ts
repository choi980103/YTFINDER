const STORAGE_KEY = "yt_access_code";

/**
 * 액세스 코드를 x-access-code 헤더에 포함하여 fetch 요청.
 */
export function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const accessCode = typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY) || ""
    : "";

  const headers = new Headers(options.headers);
  headers.set("x-access-code", accessCode);

  return fetch(url, { ...options, headers });
}
