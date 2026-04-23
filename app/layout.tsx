import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YTFINDER - 떡상 유튜브 채널 분석 플랫폼",
  description:
    "구독자 수 대비 평균 조회수가 압도적으로 높은 유튜브 채널을 찾아주는 분석 플랫폼",
  openGraph: {
    title: "YTFINDER - 떡상 유튜브 채널 분석 플랫폼",
    description: "구독자 대비 조회수가 비정상적으로 높은 쇼츠 채널을 찾아드립니다. 알고리즘이 밀어주는 떡상 직전 채널을 발견하세요!",
    type: "website",
    locale: "ko_KR",
    siteName: "YTFINDER",
  },
  twitter: {
    card: "summary_large_image",
    title: "YTFINDER - 떡상 유튜브 채널 분석 플랫폼",
    description: "구독자 대비 조회수가 비정상적으로 높은 쇼츠 채널을 찾아드립니다. 알고리즘이 밀어주는 떡상 직전 채널을 발견하세요!",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-zinc-100">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
