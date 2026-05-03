-- YTFINDER 어드민 DB 스키마 (Supabase)
-- 실행: Supabase 대시보드 → SQL Editor → New query → 붙여넣고 RUN

-- ============================================================================
-- access_codes: 발급된 액세스 코드 마스터
-- ============================================================================
create table if not exists public.access_codes (
  code              text primary key,
  status            text not null default 'active'
                    check (status in ('active','revoked','expired')),
  plan              text not null
                    check (plan in ('free_trial','early','1m','3m','6m','12m','lifetime')),
  customer_email    text,
  customer_nickname text,
  issued_at         timestamptz not null default now(),
  expires_at        timestamptz,
  note              text
);

create index if not exists access_codes_status_idx
  on public.access_codes (status);
create index if not exists access_codes_email_idx
  on public.access_codes (customer_email);

-- ============================================================================
-- orders: 결제/주문 이력
-- ============================================================================
create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  customer_email    text,
  customer_nickname text,
  channel           text not null
                    check (channel in ('kmong','paymentteacher','toss','manual')),
  amount            integer not null check (amount >= 0),
  plan              text not null
                    check (plan in ('free_trial','early','1m','3m','6m','12m','lifetime')),
  access_code       text references public.access_codes(code) on delete set null,
  paid_at           timestamptz not null default now(),
  note              text
);

create index if not exists orders_paid_at_idx on public.orders (paid_at desc);
create index if not exists orders_channel_idx on public.orders (channel);
create index if not exists orders_email_idx   on public.orders (customer_email);

-- ============================================================================
-- RLS: 모든 작업은 서버에서 service(secret) key로 수행 → 정책 추가 안 함
-- (publishable key로는 아무것도 안 보이게)
-- ============================================================================
alter table public.access_codes enable row level security;
alter table public.orders       enable row level security;
