import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function TestLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">{children}</div>;
}
