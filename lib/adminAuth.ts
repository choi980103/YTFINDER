// 어드민 세션 토큰 = SHA-256(ADMIN_PASSWORD).
// 평문 비번을 쿠키에 담지 않고, 매 요청 해시 비교만 수행.
// Edge runtime(proxy)과 Node runtime(route handler) 양쪽에서 동작하도록 Web Crypto 사용.

export const ADMIN_COOKIE_NAME = "ytf_admin";
export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30일

export async function adminTokenFromPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(password)
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function expectedToken(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  return adminTokenFromPassword(pw);
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  if (password.length !== pw.length) return false;
  let diff = 0;
  for (let i = 0; i < pw.length; i++) {
    diff |= password.charCodeAt(i) ^ pw.charCodeAt(i);
  }
  return diff === 0;
}

export async function isValidAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await expectedToken();
  if (!expected) return false;
  if (token.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < token.length; i++) {
    diff |= token.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return diff === 0;
}
