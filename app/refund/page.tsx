import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "환불정책 | YTFINDER",
  description: "YTFINDER 결제 환불 및 청약철회 정책",
  robots: { index: true, follow: true },
};

export default function RefundPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen max-w-3xl px-5 py-12 sm:py-16">
        <header className="mb-10 border-b border-white/[0.06] pb-6">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">환불정책</h1>
          <p className="mt-2 text-sm text-zinc-400">시행일: 2026년 5월 3일</p>
        </header>

        <article className="max-w-none text-sm leading-relaxed text-zinc-300">
          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제1조 (목적)</h2>
            <p>
              본 정책은 시나브로(이하 &quot;회사&quot;)가 제공하는 YTFINDER 서비스(이하 &quot;서비스&quot;)의
              결제 환불 및 청약철회에 관한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제2조 (청약철회 권리)</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>이용자는 결제일로부터 7일 이내에 청약을 철회할 수 있습니다.</li>
              <li>
                다음의 경우에는 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조 제2항에 따라
                청약철회가 제한됩니다.
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-zinc-400">
                  <li>결제 후 서비스를 이용한 경우 (단, 사용 일수에 비례한 일할 환불은 제3조에 따름)</li>
                  <li>결제일로부터 7일을 초과한 경우</li>
                  <li>부정사용·약관 위반으로 이용이 정지된 경우</li>
                </ol>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제3조 (환불 기준)</h2>
            <ol className="list-decimal space-y-3 pl-5">
              <li>
                <span className="font-semibold text-zinc-100">결제 후 7일 이내 + 미사용</span>: 전액 환불
              </li>
              <li>
                <span className="font-semibold text-zinc-100">결제 후 7일 이내 + 사용 시작</span>: 일할 차감 환불
                <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-zinc-400">
                  <p>환불 금액 = 결제 금액 − (1일 이용료 × 사용 일수) − 결제 수수료</p>
                  <p className="mt-1">1일 이용료 = 결제 금액 ÷ 약정 기간(일수)</p>
                </div>
              </li>
              <li>
                <span className="font-semibold text-zinc-100">결제 후 7일 초과</span>: 환불 불가
                <p className="mt-1 text-xs text-zinc-400">
                  단, 회사의 귀책사유로 서비스 이용이 불가능한 경우는 별도 협의합니다.
                </p>
              </li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제4조 (환불 신청 방법)</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                이메일 신청:{" "}
                <a
                  href="mailto:seenabr00@gmail.com"
                  className="text-[#06b6d4] underline underline-offset-2 hover:text-[#00e5a0]"
                >
                  seenabr00@gmail.com
                </a>
              </li>
              <li>
                신청 시 필요 정보: 결제일, 주문번호, 결제 카드 마지막 4자리, 환불 사유
              </li>
              <li>회사는 신청 접수일로부터 영업일 3일 이내 처리 결과를 회신합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제5조 (환불 처리)</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>환불은 결제 시 사용한 동일한 결제수단으로 처리됩니다 (카드 결제 취소).</li>
              <li>카드사 정책에 따라 실제 환불 반영까지 영업일 3~7일이 소요될 수 있습니다.</li>
              <li>회사는 환불 처리 완료 후 이용자에게 이메일로 통지합니다.</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제6조 (자동결제 해지)</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>이용자는 결제 페이지 또는 이메일을 통해 자동결제 해지를 신청할 수 있습니다.</li>
              <li>
                해지 신청 시 다음 결제 예정일부터 자동결제가 중지되며, 이미 결제된 기간은 만료일까지
                정상 이용 가능합니다.
              </li>
              <li>자동결제 해지와 환불은 별개입니다 (해지만으로는 환불되지 않습니다).</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제7조 (면책)</h2>
            <p className="mb-2">다음의 경우 회사는 환불 의무를 부담하지 않습니다.</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>천재지변, 외부 API(YouTube Data API 등) 정책 변경 또는 장애로 인한 서비스 중단</li>
              <li>이용자의 고의·과실(API 키 유출, 액세스 코드 공유, 약관 위반 등)</li>
              <li>무료 체험 코드(YTFINDER-FREE-TRIAL) 사용분</li>
              <li>이미 환불 처리된 결제분의 재요청</li>
            </ol>
          </section>

          <section className="mb-8">
            <h2 className="mb-3 text-lg font-bold text-white">제8조 (분쟁 해결)</h2>
            <ol className="list-decimal space-y-2 pl-5">
              <li>환불 관련 분쟁은 우선 회사와 이용자 간 협의로 해결합니다.</li>
              <li>
                협의가 어려운 경우 「전자상거래 등에서의 소비자보호에 관한 법률」 및 관련 법령에 따라
                해결합니다.
              </li>
              <li>분쟁 발생 시 관할 법원은 민사소송법상의 관할 법원으로 합니다.</li>
            </ol>
          </section>

          <section className="mb-8 rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="mb-3 text-lg font-bold text-white">사업자 정보</h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-zinc-400">상호</dt>
              <dd className="text-zinc-200">시나브로</dd>
              <dt className="text-zinc-400">대표자</dt>
              <dd className="text-zinc-200">최준혁</dd>
              <dt className="text-zinc-400">사업자등록번호</dt>
              <dd className="text-zinc-200">187-21-02241</dd>
              <dt className="text-zinc-400">문의 이메일</dt>
              <dd className="text-zinc-200">seenabr00@gmail.com</dd>
            </dl>
          </section>

          <section className="border-t border-white/[0.06] pt-6 text-xs text-zinc-400">
            <p>부칙</p>
            <p className="mt-1">본 정책은 2026년 5월 3일부터 시행합니다.</p>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
