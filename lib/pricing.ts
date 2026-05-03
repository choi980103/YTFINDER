export interface Plan {
  id: "1m" | "3m" | "6m" | "12m";
  months: number;
  price: number;
  label: string;
  monthly: number;
  discount: number;
  badge?: string;
  highlight?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: "1m",
    months: 1,
    price: 29_900,
    label: "1개월",
    monthly: 29_900,
    discount: 0,
  },
  {
    id: "3m",
    months: 3,
    price: 79_000,
    label: "3개월",
    monthly: 26_333,
    discount: 12,
  },
  {
    id: "6m",
    months: 6,
    price: 149_000,
    label: "6개월",
    monthly: 24_833,
    discount: 17,
    badge: "인기",
  },
  {
    id: "12m",
    months: 12,
    price: 249_000,
    label: "12개월",
    monthly: 20_750,
    discount: 31,
    badge: "최대 할인",
    highlight: true,
  },
];

export function getPlan(id: Plan["id"]): Plan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function formatKRW(n: number): string {
  return `₩${n.toLocaleString("ko-KR")}`;
}
