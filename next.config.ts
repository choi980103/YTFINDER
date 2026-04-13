import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // HTTPS 강제 (HSTS) - 1년, 서브도메인 포함, preload 대응
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // 클릭재킹 방지
          { key: "X-Frame-Options", value: "DENY" },
          // MIME 스니핑 방지
          { key: "X-Content-Type-Options", value: "nosniff" },
          // XSS 필터
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Referrer 정책
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // DNS 프리페치
          { key: "X-DNS-Prefetch-Control", value: "on" },
          // 권한 정책 (카메라, 마이크, 위치 차단)
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // CSP - XSS 및 악성 스크립트 삽입 방지
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://yt3.ggpht.com https://i.ytimg.com https://*.googleusercontent.com",
              "font-src 'self'",
              "connect-src 'self' https://www.googleapis.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
