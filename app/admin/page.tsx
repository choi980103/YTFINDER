import Link from "next/link";
import { getSupabaseAdmin } from "@/lib/supabase";
import AdminHeader from "@/components/admin/AdminHeader";
import CodeActions from "@/components/admin/CodeActions";

export const dynamic = "force-dynamic";

type OrderRow = {
  id: string;
  customer_email: string | null;
  customer_nickname: string | null;
  channel: string;
  amount: number;
  plan: string;
  access_code: string | null;
  paid_at: string;
  note: string | null;
};

type AccessCodeRow = {
  code: string;
  status: string;
  plan: string;
  customer_email: string | null;
  customer_nickname: string | null;
  issued_at: string;
  expires_at: string | null;
  note: string | null;
};

const PLAN_LABEL: Record<string, string> = {
  free_trial: "무료체험",
  early: "얼리버드",
  "1m": "1개월",
  "3m": "3개월",
  "6m": "6개월",
  "12m": "12개월",
  lifetime: "평생",
};

const CHANNEL_LABEL: Record<string, string> = {
  kmong: "크몽",
  paymentteacher: "결제선생",
  toss: "토스",
  manual: "수동",
};

const STATUS_LABEL: Record<string, string> = {
  active: "활성",
  revoked: "회수",
  expired: "만료",
};

function fmtKRW(n: number) {
  return `₩${n.toLocaleString("ko-KR")}`;
}

function fmtDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminHomePage() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return (
      <main className="min-h-screen bg-neutral-100">
        <AdminHeader />
        <div className="mx-auto max-w-5xl p-6">
          <div className="rounded border border-red-300 bg-red-50 p-4 text-sm text-red-800">
            <strong>Supabase 미설정.</strong> 환경변수
            <code className="mx-1">NEXT_PUBLIC_SUPABASE_URL</code> 와
            <code className="mx-1">SUPABASE_SECRET_KEY</code> 를 확인해주세요.
          </div>
        </div>
      </main>
    );
  }

  const [ordersRes, codesRes, codesCountRes] = await Promise.all([
    admin
      .from("orders")
      .select("*")
      .order("paid_at", { ascending: false })
      .limit(50),
    admin
      .from("access_codes")
      .select("*")
      .order("issued_at", { ascending: false })
      .limit(100),
    admin
      .from("access_codes")
      .select("status", { count: "exact", head: false }),
  ]);

  const orders = (ordersRes.data || []) as OrderRow[];
  const codes = (codesRes.data || []) as AccessCodeRow[];
  const allCodes = (codesCountRes.data || []) as Pick<AccessCodeRow, "status">[];

  const counts = {
    active: allCodes.filter((c) => c.status === "active").length,
    revoked: allCodes.filter((c) => c.status === "revoked").length,
    expired: allCodes.filter((c) => c.status === "expired").length,
  };

  const totalRevenue = orders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <main className="min-h-screen bg-neutral-100">
      <AdminHeader />
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card label="활성 코드" value={`${counts.active}`} />
          <Card label="회수 코드" value={`${counts.revoked}`} />
          <Card label="만료 코드" value={`${counts.expired}`} />
          <Card label="최근 50건 매출" value={fmtKRW(totalRevenue)} />
        </section>

        <section className="rounded border border-neutral-300 bg-white">
          <header className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">주문 (최근 50건)</h2>
            <Link
              href="/admin/new"
              className="rounded bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white"
            >
              + 새 주문
            </Link>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <Th>결제일</Th>
                  <Th>채널</Th>
                  <Th>플랜</Th>
                  <Th>금액</Th>
                  <Th>이메일</Th>
                  <Th>닉네임</Th>
                  <Th>코드</Th>
                  <Th>메모</Th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-neutral-400">
                      주문이 없습니다.
                    </td>
                  </tr>
                )}
                {orders.map((o) => (
                  <tr key={o.id} className="border-t border-neutral-100">
                    <Td>{fmtDate(o.paid_at)}</Td>
                    <Td>{CHANNEL_LABEL[o.channel] || o.channel}</Td>
                    <Td>{PLAN_LABEL[o.plan] || o.plan}</Td>
                    <Td>{fmtKRW(o.amount)}</Td>
                    <Td>{o.customer_email || "—"}</Td>
                    <Td>{o.customer_nickname || "—"}</Td>
                    <Td>
                      {o.access_code ? (
                        <code className="text-xs">{o.access_code}</code>
                      ) : (
                        "—"
                      )}
                    </Td>
                    <Td>{o.note || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded border border-neutral-300 bg-white">
          <header className="border-b border-neutral-200 px-4 py-3">
            <h2 className="text-sm font-semibold text-neutral-900">
              액세스 코드 (최근 100건)
            </h2>
          </header>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-neutral-50 text-neutral-600">
                <tr>
                  <Th>발급일</Th>
                  <Th>코드</Th>
                  <Th>상태</Th>
                  <Th>플랜</Th>
                  <Th>만료</Th>
                  <Th>이메일</Th>
                  <Th>닉네임</Th>
                  <Th>메모</Th>
                  <Th>액션</Th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => {
                  const isExpiringSoon =
                    c.expires_at &&
                    new Date(c.expires_at).getTime() - Date.now() <
                      7 * 24 * 3600 * 1000;
                  return (
                    <tr key={c.code} className="border-t border-neutral-100">
                      <Td>{fmtDate(c.issued_at)}</Td>
                      <Td>
                        <code className="text-xs">{c.code}</code>
                      </Td>
                      <Td>
                        <span
                          className={
                            c.status === "active"
                              ? "text-emerald-700"
                              : c.status === "revoked"
                              ? "text-red-700"
                              : "text-neutral-500"
                          }
                        >
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </Td>
                      <Td>{PLAN_LABEL[c.plan] || c.plan}</Td>
                      <Td>
                        <span
                          className={
                            isExpiringSoon ? "text-orange-700 font-medium" : ""
                          }
                        >
                          {c.expires_at ? fmtDate(c.expires_at) : "영구"}
                        </span>
                      </Td>
                      <Td>{c.customer_email || "—"}</Td>
                      <Td>{c.customer_nickname || "—"}</Td>
                      <Td>{c.note || "—"}</Td>
                      <Td>
                        <CodeActions code={c.code} status={c.status} />
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-neutral-300 bg-white p-4">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-neutral-900">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-left font-medium tracking-wide uppercase">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 text-neutral-800">{children}</td>;
}
