import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "YTFINDER 소개 | 숨겨진 꿀통 채널 발굴 플랫폼",
  description:
    "YouTube 쇼츠 떡상 채널을 데이터로 분석하는 한국 최초의 꿀통 발굴 플랫폼. 꿀통 지수, 글로벌 트렌드, 채널 비교까지.",
  robots: { index: true, follow: true },
};

export default function IntroPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen bg-[#0a0a0f] text-zinc-100">
        {/* HERO */}
        <section className="relative overflow-hidden px-5 py-20 sm:py-28">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,229,160,0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[12px] font-bold text-red-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" />
              초기 멤버 한정 특가 진행 중
            </div>

            <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
              YT<span className="gradient-text">FINDER</span>
            </h1>
            <p className="mt-6 text-xl font-semibold text-zinc-200 sm:text-2xl">
              숨겨진 꿀통 채널을 가장 먼저 발견하세요
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500 sm:text-base">
              남들보다 먼저 꿀통을 선점하세요.<br />
              조회수가 폭발하는 숨은 채널을 데이터로 먼저 발굴해드립니다.
            </p>

            <div className="mx-auto mt-10 inline-flex flex-col items-center rounded-2xl border border-white/[0.08] bg-white/[0.02] px-8 py-7 sm:px-12">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 px-3.5 py-1 text-[12px] font-extrabold tracking-wider text-white shadow-lg shadow-red-500/30">
                🔥 12개월 구독 31% OFF
              </span>
              <span className="text-xs text-zinc-500">12개월 구독 · 최대 할인</span>
              <span className="mt-1 text-sm text-zinc-600 line-through">월 ₩29,900</span>
              <div className="mt-1 flex items-baseline gap-3">
                <span className="text-4xl font-black sm:text-5xl">
                  <span className="gradient-text">₩249,000</span>
                </span>
                <span className="rounded-md bg-red-500 px-2 py-0.5 text-base font-black text-white">
                  -31%
                </span>
              </div>
              <span className="mt-2 text-xs text-zinc-500">월 환산 ₩20,750 · 부가세 포함</span>
              <Link
                href="/subscribe?plan=12m"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-7 py-3 text-sm font-extrabold text-[#0a0a0f] shadow-lg shadow-[#00e5a0]/25 transition-transform hover:scale-[1.02]"
              >
                지금 시작하기 →
              </Link>
              <span className="mt-3 text-[11px] text-zinc-500">
                1개월부터 가능 · 언제든 해지
              </span>
            </div>
          </div>
        </section>

        {/* STATS */}
        <div className="border-y border-white/[0.04]">
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-6 px-5 py-10 sm:grid-cols-4 sm:py-12">
            <Stat number="300+" label="분석 채널 수" />
            <Stat number="15+" label="분석 카테고리" />
            <Stat number="24/7" label="실시간 업데이트" />
            <Stat number="100%" label="웹 기반 (설치 불필요)" />
          </div>
        </div>

        {/* PAIN POINTS */}
        <Section label="Problem" title="이런 고민, 해보셨나요?">
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <PainCard icon="😩" title="수익 나는 채널을 찾기 어렵다">
              진짜 돈이 되는 꿀통 채널은 어디 있는지, 어떤 콘텐츠가 수익성이 높은지 감이 안 잡히죠.
            </PainCard>
            <PainCard icon="🔍" title="경쟁 채널 분석이 번거롭다">
              하나하나 찾아보기엔 시간이 너무 오래 걸리고 체계적으로 비교하기 어렵습니다.
            </PainCard>
            <PainCard icon="📉" title="내 채널 성장이 정체됐다">
              구독자는 안 늘고, 수익도 안 나고... 뭘 해야 성장할 수 있는지 파악이 안 됩니다.
            </PainCard>
            <PainCard icon="💸" title="해외 분석 툴은 비싸다">
              해외 분석 툴은 월 구독료가 부담스럽고 한국 쇼츠 시장에 최적화돼 있지 않습니다.
            </PainCard>
          </div>
        </Section>

        {/* FEATURES */}
        <Section
          label="Solution"
          title={
            <>
              YTFINDER가 <span className="gradient-text">한 번에 정리</span>해드립니다
            </>
          }
          desc="현직 유튜브 크리에이터 4년차가 직접 만든 분석 도구. 크리에이터가 진짜 필요한 기능만 담았습니다."
        >
          <div className="mt-12 flex flex-col gap-4">
            <FeatureItem
              icon="📊"
              iconBg="bg-[#00e5a0]/10"
              title="꿀통 지수 스코어링"
              desc="조회수/구독자 비율 + 수익성 + 성장률을 종합 분석한 독자적 스코어링 시스템. 숨겨진 꿀통 채널을 숫자로 확인하세요."
              tag={{ label: "핵심 기능", color: "bg-[#00e5a0]/10 text-[#00e5a0]" }}
            />
            <FeatureItem
              icon="🌍"
              iconBg="bg-[#06b6d4]/10"
              title="글로벌 트렌드 분석"
              desc="한국뿐 아니라 미국, 일본 등 해외 쇼츠 트렌드까지 한눈에 파악. 글로벌 진출을 고민 중이라면 필수입니다."
            />
            <FeatureItem
              icon="💎"
              iconBg="bg-purple-500/10"
              title="히든 꿀통 자동 발굴"
              desc="아직 덜 알려졌지만 수익성이 높고 폭발적으로 성장 중인 채널을 자동으로 찾아냅니다. 남들보다 먼저 꿀통을 선점하세요."
            />
            <FeatureItem
              icon="⚡"
              iconBg="bg-amber-400/10"
              title="오늘의 Top 100 영상"
              desc="매일 업데이트되는 인기 쇼츠 영상 순위. 지금 가장 핫한 콘텐츠가 무엇인지 실시간으로 확인하세요."
              tag={{ label: "인기 기능", color: "bg-amber-400/10 text-amber-400" }}
            />
            <FeatureItem
              icon="🔬"
              iconBg="bg-pink-400/10"
              title="채널 비교 & 벤치마크"
              desc="내 채널과 경쟁 채널을 나란히 비교 분석. 어디서 차이가 나는지 한눈에 파악하고 전략을 세울 수 있습니다."
            />
            <FeatureItem
              icon="📁"
              iconBg="bg-emerald-500/10"
              title="내 활동 & 메모"
              desc="즐겨찾기, 최근 본 채널, 메모 기능으로 관심 채널을 체계적으로 관리할 수 있습니다."
            />
          </div>
        </Section>

        {/* TABS */}
        <Section
          label="Interface"
          title={
            <>
              직관적인 <span className="gradient-text">4개 탭</span> 구성
            </>
          }
          desc="필요한 정보에 빠르게 접근할 수 있도록 목적별로 분류했습니다."
          center
        >
          <div className="mx-auto mt-10 flex flex-wrap justify-center gap-2">
            <TabBadge active>📊 대시보드</TabBadge>
            <TabBadge>🔍 채널 탐색</TabBadge>
            <TabBadge>🔥 Top 100</TabBadge>
            <TabBadge>📁 내 활동</TabBadge>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <TabCard title="📊 대시보드">
              전체 트렌드 요약, 오늘의 꿀통 채널, 추천 채널을 한 화면에서 확인
            </TabCard>
            <TabCard title="🔍 채널 탐색">
              카테고리별, 구독자 수, 채널 나이, 수익 등 다양한 필터로 채널 검색
            </TabCard>
            <TabCard title="🔥 Top 100">
              매일 갱신되는 인기 쇼츠 영상 순위. 최근 3일 이내 핫한 영상만 선별
            </TabCard>
            <TabCard title="📁 내 활동">
              즐겨찾기, 최근 본 채널, 메모, 벤치마크 등 내 분석 활동을 한곳에서 관리
            </TabCard>
          </div>
        </Section>

        {/* COMPARISON */}
        <Section
          label="Comparison"
          title={
            <>
              다른 분석 툴과 <span className="gradient-text">비교</span>해보세요
            </>
          }
        >
          <div className="mt-10 overflow-x-auto rounded-2xl border border-white/[0.06]">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead className="bg-white/[0.03]">
                <tr>
                  <th className="px-3 py-3.5 text-left font-bold text-zinc-400">항목</th>
                  <th className="px-3 py-3.5 font-bold text-zinc-400">A사</th>
                  <th className="px-3 py-3.5 font-bold text-zinc-400">B사</th>
                  <th className="px-3 py-3.5 font-bold text-zinc-400">C사</th>
                  <th className="px-3 py-3.5 font-bold text-zinc-400">D사</th>
                  <th className="px-3 py-3.5 font-bold text-[#00e5a0]">YTFINDER</th>
                </tr>
              </thead>
              <tbody className="text-zinc-500">
                <CompareRow item="꿀통 지수 스코어링" cells={[false, false, false, false, true]} />
                <CompareRow item="히든 꿀통 채널 발굴" cells={[false, false, false, false, true]} />
                <CompareRow item="쇼츠 특화 분석" cells={[false, "일부", true, false, true]} />
                <CompareRow item="채널 비교 분석" cells={[true, true, false, true, true]} />
                <CompareRow item="글로벌 트렌드" cells={[true, false, true, true, true]} />
                <CompareRow item="구독제 (월 ₩20,750~)" cells={[false, false, false, false, true]} />
              </tbody>
            </table>
          </div>
        </Section>

        {/* INCLUDED */}
        <Section
          label="What's included"
          title={
            <>
              구독에 <span className="gradient-text">포함된 것들</span>
            </>
          }
        >
          <div className="mt-10 grid gap-3 sm:grid-cols-3">
            {[
              "꿀통 지수 분석",
              "글로벌 트렌드",
              "Top 100 영상",
              "채널 비교 분석",
              "벤치마크 기능",
              "채널 상세 분석",
              "즐겨찾기 & 메모",
              "향후 업데이트 무료",
              "1:1 사용법 안내",
            ].map((it) => (
              <div
                key={it}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5 text-sm font-semibold text-zinc-300"
              >
                <span className="text-base text-[#00e5a0]">✓</span>
                {it}
              </div>
            ))}
          </div>
        </Section>

        {/* RECOMMENDED FOR */}
        <Section
          label="Recommended for"
          title={
            <>
              이런 분께 <span className="gradient-text">추천드립니다</span>
            </>
          }
        >
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <RecommendCard icon="🎬" tag="입문 · 성장 단계">
              쇼츠 채널을 새로 시작해 레퍼런스 채널을 빠르게 찾고 싶은 초보 크리에이터
            </RecommendCard>
            <RecommendCard icon="📊" tag="중급 · 벤치마킹">
              내 채널과 경쟁 채널을 정량 지표로 비교해 전략을 세우고 싶은 운영자
            </RecommendCard>
            <RecommendCard icon="🔍" tag="콘텐츠 기획">
              트렌드에 맞는 주제·포맷을 데이터로 연구하는 콘텐츠 기획자·마케터
            </RecommendCard>
            <RecommendCard icon="💎" tag="리서치 · 발굴">
              아직 덜 알려졌지만 성장 중인 채널을 먼저 발굴하고 싶은 트렌드 헌터
            </RecommendCard>
          </div>
        </Section>

        {/* FAQ */}
        <Section
          label="FAQ"
          title={
            <>
              자주 묻는 <span className="gradient-text">질문</span>
            </>
          }
        >
          <div className="mt-10 flex flex-col gap-3">
            <FaqItem q="구독은 어떻게 결제되나요?">
              1·3·6·12개월 단위로 결제하시며, 기간이 길수록 할인 폭이 커집니다.
              (12개월 31%, 6개월 17%, 3개월 12% 할인)
            </FaqItem>
            <FaqItem q="별도 프로그램 설치가 필요한가요?">
              아니요! 100% 웹 기반 서비스라 브라우저만 있으면 PC, 태블릿, 모바일 어디서든 사용
              가능합니다.
            </FaqItem>
            <FaqItem q="YouTube API 키는 뭔가요? 어렵지 않나요?">
              Google에서 무료로 발급받을 수 있는 키입니다. 가입 후 상세한 발급 가이드를
              제공해드리며, 5분 내 발급 가능합니다.
            </FaqItem>
            <FaqItem q="환불이 가능한가요?">
              결제일로부터 7일 이내, 서비스를 사용하지 않으셨다면 전액 환불 가능합니다.
              자세한 사항은 <Link href="/refund" className="underline decoration-dotted underline-offset-2 hover:text-zinc-200">환불정책</Link>을
              참고해주세요.
            </FaqItem>
            <FaqItem q="자동 갱신되나요?">
              아니요. 기간 결제이며 만료 후 다시 결제하셔야 이용 가능합니다.
              자동으로 빠져나가지 않으니 안심하세요.
            </FaqItem>
          </div>
        </Section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden px-5 py-20 sm:py-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_100%,rgba(0,229,160,0.08),transparent_60%)]" />
          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-3 text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">
              Get started
            </div>
            <h2 className="text-3xl font-black sm:text-4xl">
              지금 시작하면 <span className="gradient-text">월 2만원대</span>로 가능합니다
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-zinc-400">
              12개월 구독 ₩249,000 (월 환산 ₩20,750 · 31% 할인). 1·3·6개월 플랜도 준비돼 있습니다.
            </p>
            <Link
              href="/subscribe?plan=12m"
              className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#00e5a0] to-[#06b6d4] px-10 py-4 text-base font-extrabold text-[#0a0a0f] shadow-xl shadow-[#00e5a0]/25 transition-transform hover:scale-[1.02]"
            >
              🚀 구독 플랜 보기
            </Link>
            <div className="mt-6 flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs text-zinc-500">
              <span><span className="text-[#00e5a0]">🔒</span> 토스페이먼츠 안전 결제</span>
              <span><span className="text-[#00e5a0]">♾️</span> 구독 기간 업데이트 무료</span>
              <span><span className="text-[#00e5a0]">💬</span> 1:1 사용법 안내</span>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/* ───────── Sub components ───────── */

function Section({
  label,
  title,
  desc,
  center,
  children,
}: {
  label: string;
  title: React.ReactNode;
  desc?: string;
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-white/[0.04] px-5 py-16 sm:py-20">
      <div className={`mx-auto max-w-3xl ${center ? "text-center" : ""}`}>
        <div className="text-xs font-bold uppercase tracking-[3px] text-[#00e5a0]">{label}</div>
        <h2 className="mt-4 text-2xl font-black leading-tight sm:text-3xl">{title}</h2>
        {desc && (
          <p className={`mt-4 max-w-xl text-sm leading-relaxed text-zinc-400 sm:text-base ${center ? "mx-auto" : ""}`}>
            {desc}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

function Stat({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl font-black sm:text-4xl gradient-text">{number}</div>
      <div className="mt-1 text-xs text-zinc-500 sm:text-sm">{label}</div>
    </div>
  );
}

function PainCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-3 text-2xl">{icon}</div>
      <h3 className="mb-2 text-base font-bold text-zinc-100">{title}</h3>
      <p className="text-sm leading-relaxed text-zinc-500">{children}</p>
    </div>
  );
}

function FeatureItem({
  icon,
  iconBg,
  title,
  desc,
  tag,
}: {
  icon: string;
  iconBg: string;
  title: string;
  desc: string;
  tag?: { label: string; color: string };
}) {
  return (
    <div className="flex items-start gap-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-xl ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="mb-1.5 text-base font-bold text-zinc-100 sm:text-lg">{title}</h3>
        <p className="text-sm leading-relaxed text-zinc-400">{desc}</p>
        {tag && (
          <span className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${tag.color}`}>
            {tag.label}
          </span>
        )}
      </div>
    </div>
  );
}

function TabBadge({
  children,
  active,
}: {
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-2 text-sm font-semibold ${
        active
          ? "border-[#00e5a0]/30 bg-[#00e5a0]/10 text-[#00e5a0]"
          : "border-white/[0.06] bg-white/[0.02] text-zinc-500"
      }`}
    >
      {children}
    </div>
  );
}

function TabCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-left">
      <h4 className="mb-2 text-sm font-bold text-zinc-100">{title}</h4>
      <p className="text-sm leading-relaxed text-zinc-500">{children}</p>
    </div>
  );
}

function CompareRow({ item, cells }: { item: string; cells: (boolean | string)[] }) {
  return (
    <tr className="border-t border-white/[0.04]">
      <td className="px-3 py-3.5 text-left font-semibold text-zinc-300">{item}</td>
      {cells.map((c, i) => (
        <td
          key={i}
          className={`px-3 py-3.5 text-center ${i === cells.length - 1 ? "bg-[#00e5a0]/[0.03] text-zinc-200" : ""}`}
        >
          {c === true ? (
            <span className="text-lg font-bold text-[#00e5a0]">✓</span>
          ) : c === false ? (
            <span className="text-lg text-zinc-700">✕</span>
          ) : (
            <span className="text-xs">{c}</span>
          )}
        </td>
      ))}
    </tr>
  );
}

function RecommendCard({
  icon,
  tag,
  children,
}: {
  icon: string;
  tag: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-3 text-xl">{icon}</div>
      <p className="mb-3 text-sm leading-relaxed text-zinc-300">{children}</p>
      <div className="text-xs font-semibold text-zinc-600">{tag}</div>
    </div>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6">
      <div className="mb-2 flex items-center gap-2 text-sm font-bold text-zinc-200 sm:text-base">
        <span>💬</span>
        {q}
      </div>
      <p className="pl-6 text-sm leading-relaxed text-zinc-500">{children}</p>
    </div>
  );
}
