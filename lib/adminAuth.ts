// 어드민 세션 토큰 = SHA-256(비번).
// 평문 비번을 쿠키에 담지 않고, 매 요청 해시 비교만 수행.
// Edge runtime(proxy)과 Node runtime(route handler) 양쪽에서 동작하도록 Web Crypto 사용.
// 다중 비번 지원: ADMIN_PASSWORDS (콤마 구분) 우선, 없으면 ADMIN_PASSWORD (단일) 사용.

export const ADMIN_COOKIE_NAME = "ytf_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

function getAdminPasswords(): string[] {
  const multi = process.env.ADMIN_PASSWORDS;
  if (multi) {
    return multi.split(",").map((s) => s.trim()).filter(Boolean);
  }
  const single = process.env.ADMIN_PASSWORD;
  return single ? [single] : [];
}

export async function adminTokenFromPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const passwords = getAdminPasswords();
  if (passwords.length === 0) return false;
  // 모든 비번에 대해 길이가 같으면 비교 (타이밍 공격 방지)
  let matched = false;
  for (const pw of passwords) {
    if (constantTimeEqual(password, pw)) matched = true;
  }
  return matched;
}

export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const passwords = getAdminPasswords();
  if (passwords.length === 0) return false;
  let matched = false;
  for (const pw of passwords) {
    const expected = await adminTokenFromPassword(pw);
    if (constantTimeEqual(token, expected)) matched = true;
  }
  return matched;
}
