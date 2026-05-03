import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "개인정보처리방침 | YTFINDER",
  description: "YTFINDER 개인정보처리방침",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:py-16">

      <header className="mb-10 border-b border-white/[0.06] pb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-zinc-400">시행일: 2026년 4월 22일</p>
      </header>

      <article className="max-w-none text-sm leading-relaxed text-zinc-300">
        <section className="mb-8 rounded-xl border border-yellow-400/20 bg-yellow-400/[0.04] p-4 text-xs text-yellow-100/80">
          <p className="font-semibold text-yellow-300">요약</p>
          <p className="mt-1.5">YTFINDER는 회원가입이 없으며, 개인정보를 서버에 저장하지 않습니다. 이용자가 입력한 YouTube API 키와 검색 기록은 이용자 브라우저(localStorage)에만 보관됩니다.</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">1. 수집하는 개인정보 항목</h2>
          <p className="mb-3">시나브로(이하 &quot;회사&quot;)는 YTFINDER(이하 &quot;서비스&quot;) 운영을 위해 다음과 같은 최소한의 정보만 수집합니다.</p>

          <div className="space-y-3">
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-2 text-sm font-bold text-white">가. 서버에 일시 저장되는 정보</h3>
              <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-400">
                <li>접속 IP 주소 (Rate Limit·어뷰징 방지 목적)</li>
                <li>액세스 코드 인증 실패 기록 (IP별 30분, 브루트포스 차단 목적)</li>
                <li>서비스 이용 로그 (에러 추적 목적)</li>
              </ul>
              <p className="mt-2 text-xs text-zinc-400">※ 위 정보는 서버 메모리에 일시 보관되며, 주기적으로 자동 삭제됩니다.</p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-2 text-sm font-bold text-white">나. 이용자 브라우저(localStorage)에만 저장되는 정보</h3>
              <ul className="list-disc space-y-1 pl-5 text-xs text-zinc-400">
                <li>YouTube Data API 키 (이용자가 직접 입력)</li>
                <li>액세스 코드</li>
                <li>검색 기록, 최근 조회 채널, 즐겨찾기, 필터 설정</li>
              </ul>
              <p className="mt-2 text-xs text-zinc-400">※ 위 정보는 <strong>이용자 기기에만 저장되며, 회사 서버로 전송되지 않습니다.</strong> 브라우저 캐시·저장소를 삭제하면 함께 삭제됩니다.</p>
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
              <h3 className="mb-2 text-sm font-bold text-white">다. 결제 관련</h3>
              <p className="text-xs text-zinc-400">
                구독 결제는 <strong>토스페이먼츠(주식회사 토스페이먼츠)</strong>를 통해 처리되며, 카드 정보는 토스페이먼츠가 직접 수집·보관합니다. 회사는 결제 정보(카드번호, CVC 등)를 일체 수집·저장하지 않으며, 결제 식별을 위한 빌링키(billingKey)와 주문 정보(주문번호, 결제 금액, 결제일)만 보관합니다.
              </p>
              <p className="mt-2 text-xs text-zinc-400">※ 평생이용권 등 일부 상품을 다른 채널(예: 크몽)에서 결제하신 경우, 해당 채널의 결제 처리 정책이 함께 적용됩니다.</p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">2. 개인정보의 이용 목적</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>서비스 제공 및 액세스 코드 인증</li>
            <li>비정상적 이용 행위(어뷰징, 브루트포스 공격 등) 방지</li>
            <li>서비스 장애 대응 및 품질 개선</li>
            <li>고객 문의 응대</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">3. 개인정보의 보유 및 이용 기간</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>접속 IP·요청 로그</strong>: 서버 메모리 기준 최대 30분, 이후 자동 삭제</li>
            <li><strong>액세스 코드 발급 기록</strong>: 서비스 종료 시점까지 (구매 증빙 및 재발급 대응 목적)</li>
            <li><strong>고객 문의 이메일 내역</strong>: 관련 법령 보관 의무에 따라 보관(전자상거래법 등)</li>
            <li>localStorage에 저장된 정보는 이용자가 직접 삭제할 수 있습니다(브라우저 설정 → 사이트 데이터 삭제).</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">4. 제3자 제공 및 위탁</h2>
          <p className="mb-3">회사는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만 아래 서비스와 필수적인 연동이 있습니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li><strong>Google LLC (YouTube Data API v3)</strong>: 채널·영상 데이터 조회를 위해 호출하며, Google의 <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-yellow-400 underline decoration-dotted underline-offset-2 hover:text-yellow-300">개인정보처리방침</a>을 따릅니다.</li>
            <li><strong>Vercel Inc.</strong>: 서비스 호스팅 및 배포 인프라. <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="text-yellow-400 underline decoration-dotted underline-offset-2 hover:text-yellow-300">Vercel Privacy Policy</a></li>
            <li><strong>토스페이먼츠(주식회사 토스페이먼츠)</strong>: 카드 결제·자동결제(빌링) 처리. 카드 정보는 토스페이먼츠에서 직접 수집·보관합니다. <a href="https://www.tosspayments.com/policies/privacy" target="_blank" rel="noreferrer" className="text-yellow-400 underline decoration-dotted underline-offset-2 hover:text-yellow-300">토스페이먼츠 개인정보처리방침</a></li>
            <li><strong>크몽(주식회사 크몽)</strong>: 평생이용권 등 별도 채널 판매 시 해당 결제 정보는 크몽에서 직접 처리합니다.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">5. 이용자의 권리</h2>
          <p className="mb-2">이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>개인정보 열람·정정·삭제·처리정지 요구</li>
            <li>localStorage 데이터 직접 삭제(브라우저 설정)</li>
            <li>액세스 코드 삭제 요청 (이메일 문의)</li>
          </ul>
          <p className="mt-3 text-xs text-zinc-400">요청은 <a href="mailto:seenabr00@gmail.com" className="text-yellow-400 underline decoration-dotted underline-offset-2 hover:text-yellow-300">seenabr00@gmail.com</a>으로 접수해 주세요.</p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">6. 개인정보의 안전성 확보 조치</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>HTTPS 암호화 통신</li>
            <li>API 요청에 대한 Rate Limit 및 CSRF(Same-Origin) 검증</li>
            <li>액세스 코드 브루트포스 방지(IP별 5회 실패 시 30분 잠금)</li>
            <li>최소한의 정보만 수집·보관</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">7. 개인정보 보호책임자</h2>
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-zinc-400">책임자</dt>
              <dd className="text-zinc-200">최준혁 (대표)</dd>
              <dt className="text-zinc-400">이메일</dt>
              <dd className="text-zinc-200">seenabr00@gmail.com</dd>
            </dl>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">8. 방침 변경</h2>
          <p>본 방침은 법령 또는 서비스 정책 변경에 따라 개정될 수 있으며, 변경 시 서비스 내 공지사항을 통해 고지합니다.</p>
        </section>

        <section className="border-t border-white/[0.06] pt-6 text-xs text-zinc-400">
          <p>부칙</p>
          <p className="mt-1">본 방침은 2026년 4월 22일부터 시행합니다.</p>
        </section>
      </article>
    </main>
    <SiteFooter />
    </>
  );
}
