import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "이용약관 | YTFINDER",
  description: "YTFINDER 서비스 이용약관",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:py-16">

      <header className="mb-10 border-b border-white/[0.06] pb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">이용약관</h1>
        <p className="mt-2 text-sm text-zinc-300">시행일: 2026년 4월 22일</p>
      </header>

      <article className="prose prose-invert max-w-none text-sm leading-relaxed text-zinc-300">
        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제1조 (목적)</h2>
          <p>
            본 약관은 시나브로(이하 &quot;회사&quot;)가 제공하는 YTFINDER 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여
            회사와 이용자의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제2조 (용어의 정의)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>&quot;서비스&quot;란 회사가 제공하는 YouTube 채널 분석 웹 서비스를 의미합니다.</li>
            <li>&quot;이용자&quot;란 본 약관에 따라 서비스를 이용하는 자를 말합니다.</li>
            <li>&quot;액세스 코드&quot;란 유료 결제 후 회사가 이용자에게 발급하는 고유 인증 코드를 말합니다.</li>
            <li>&quot;API 키&quot;란 이용자가 YouTube Data API 사용을 위해 Google에서 직접 발급받는 인증 키를 의미합니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제3조 (약관의 효력 및 변경)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
            <li>회사는 필요 시 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 변경된 약관은 게시 시점부터 효력이 발생합니다.</li>
            <li>이용자가 변경된 약관에 동의하지 않는 경우 서비스 이용을 중단하고 이용계약을 해지할 수 있습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제4조 (서비스의 제공)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>회사는 이용자에게 YouTube 채널 검색, 분석, 지표 조회 등의 기능을 제공합니다.</li>
            <li>서비스는 연중무휴 24시간 제공함을 원칙으로 하나, 점검·장애·외부 API 장애 등의 사유로 일시 중단될 수 있습니다.</li>
            <li>본 서비스는 YouTube Data API v3를 활용하며, 분석 결과는 참고용이며 정확성·완전성을 보장하지 않습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제5조 (이용요금 및 결제)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>서비스는 유료로 제공되며, 현재 판매 형태는 1·3·6·12개월 단위 정기결제(구독)입니다.</li>
            <li>결제는 토스페이먼츠(주식회사 토스페이먼츠)를 통한 신용·체크카드 자동결제로 이루어지며, 회사는 결제 정보(카드번호 등)를 직접 수집·보관하지 않습니다.</li>
            <li>구독은 약정 기간 만료 시점에 동일 조건으로 자동 갱신되며, 이용자는 결제 페이지 또는 이메일을 통해 언제든지 자동결제를 해지할 수 있습니다. 해지 시 다음 결제 예정일부터 자동결제가 중지되고, 이미 결제된 기간은 만료일까지 정상 이용 가능합니다.</li>
            <li>이용자가 평생이용권 등 별도 상품을 다른 채널(예: 크몽)에서 결제한 경우, 해당 채널의 정책 및 본 약관에 따라 이용 가능합니다.</li>
            <li>환불 관련 사항은 별도의 <a href="/refund" className="text-zinc-200 underline decoration-dotted underline-offset-2 hover:text-white">환불정책</a>을 따릅니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제6조 (이용자의 의무)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>이용자는 발급받은 액세스 코드를 제3자에게 양도·판매·공유하지 않아야 합니다.</li>
            <li>이용자는 본인이 발급받은 YouTube API 키의 관리·보관에 책임을 지며, 유출·오용으로 발생한 비용·손해에 대해 회사는 책임지지 않습니다.</li>
            <li>이용자는 본 서비스를 이용하여 다음 행위를 하여서는 안 됩니다.
              <ul className="list-disc space-y-1 pl-5 pt-1">
                <li>YouTube API 서비스 약관 및 관련 법령에 위반되는 행위</li>
                <li>서비스의 안정적 운영을 방해하는 행위(어뷰징, 우회 접근, 리버스 엔지니어링 등)</li>
                <li>타인의 권리를 침해하거나 범죄에 이용하는 행위</li>
              </ul>
            </li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제7조 (YouTube API 관련 고지)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>본 서비스는 <strong>YouTube API Services</strong>를 사용하며, 이용자는 본 서비스를 이용함으로써 <a href="https://www.youtube.com/t/terms" target="_blank" rel="noreferrer" className="text-yellow-400 underline decoration-dotted underline-offset-2 hover:text-yellow-300">YouTube 서비스 약관</a>에 동의한 것으로 간주합니다.</li>
            <li>Google의 개인정보 수집·이용은 <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="text-yellow-400 underline decoration-dotted underline-offset-2 hover:text-yellow-300">Google 개인정보처리방침</a>을 따릅니다.</li>
            <li>이용자가 입력한 YouTube API 키는 회사 서버에 저장되지 않으며, 이용자 브라우저(localStorage)에만 보관됩니다.</li>
            <li>검색 기록·관심채널 등 이용자 설정 데이터는 브라우저 localStorage에만 저장되며, 서버로 전송·저장되지 않습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제8조 (서비스의 변경 및 중단)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>회사는 서비스의 일부 또는 전부를 운영상·기술상의 필요에 따라 변경할 수 있습니다.</li>
            <li>회사는 천재지변, 외부 API 정책 변경, 사업 종료 등 불가피한 사유가 발생할 경우 서비스를 종료할 수 있으며, 이 경우 사전에 공지합니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제9조 (면책 조항)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>회사는 YouTube Data API 등 외부 서비스의 장애·정책 변경으로 인한 서비스 중단·데이터 변경에 대해 책임지지 않습니다.</li>
            <li>서비스가 제공하는 분석 지표(꿀통 지수, 떡상 지수, 예상 수익 등)는 참고용이며, 실제 수익이나 성과를 보장하지 않습니다.</li>
            <li>이용자의 고의·과실(API 키 유출, 액세스 코드 공유 등)로 발생한 손해에 대해 회사는 책임을 지지 않습니다.</li>
          </ol>
        </section>

        <section className="mb-8">
          <h2 className="mb-3 text-lg font-bold text-white">제10조 (준거법 및 관할)</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>본 약관은 대한민국 법령에 따라 해석됩니다.</li>
            <li>서비스 이용과 관련하여 분쟁이 발생할 경우 민사소송법상의 관할 법원에 소를 제기할 수 있습니다.</li>
          </ol>
        </section>

        <section className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h2 className="mb-3 text-lg font-bold text-white">사업자 정보</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-zinc-300">상호</dt>
            <dd className="text-zinc-200">시나브로</dd>
            <dt className="text-zinc-300">대표자</dt>
            <dd className="text-zinc-200">최준혁</dd>
            <dt className="text-zinc-300">사업자등록번호</dt>
            <dd className="text-zinc-200">187-21-02241</dd>
            <dt className="text-zinc-300">문의 이메일</dt>
            <dd className="text-zinc-200">seenabr00@gmail.com</dd>
            <dt className="text-zinc-300">사업장 주소</dt>
            <dd className="text-zinc-300">문의 시 별도 제공</dd>
          </dl>
        </section>

        <section className="border-t border-white/[0.06] pt-6 text-xs text-zinc-300">
          <p>부칙</p>
          <p className="mt-1">본 약관은 2026년 4월 22일부터 시행합니다.</p>
        </section>
      </article>
    </main>
    <SiteFooter />
    </>
  );
}
