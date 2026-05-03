-- Phase 5a: 사전 수집(블링/플레이보드 모델) DB 스키마
-- 실행: Supabase 대시보드 → SQL Editor → New query → 붙여넣고 RUN

-- ============================================================================
-- channels: 수집 대상 채널 마스터 + 최신 통계 캐시
-- ============================================================================
create table if not exists public.channels (
  id                text primary key,           -- UCxxxxxxxxxxxxxxxxxxxxxx
  name              text not null,
  handle            text,                       -- @핸들 (있으면)
  thumbnail         text,
  description       text,
  country           text,
  channel_created_at timestamptz,               -- 채널 생성일 (YouTube)
  category          text,                       -- 우리 분류 (쇼츠/먹방/...)
  region            text default 'kr',          -- kr/global
  -- 최신 스냅샷 캐시 (가장 최근 channel_snapshots와 동기화)
  subscribers       bigint default 0,
  total_views       bigint default 0,
  video_count       integer default 0,
  hidden_subscriber_count boolean default false,
  -- 운영 메타
  first_seen_at     timestamptz default now(),  -- 처음 수집한 시점
  last_collected_at timestamptz,                -- 마지막 수집 성공 시점
  is_active         boolean default true,       -- 수집 대상 여부
  source            text default 'discovery'    -- discovery/manual/imported
);

create index if not exists channels_subscribers_idx
  on public.channels (subscribers desc);
create index if not exists channels_region_active_idx
  on public.channels (region, is_active);
create index if not exists channels_last_collected_idx
  on public.channels (last_collected_at nulls first);
create index if not exists channels_handle_idx
  on public.channels (handle);

-- ============================================================================
-- channel_snapshots: 일자별 통계 (시계열, 성장 추적용)
-- ============================================================================
create table if not exists public.channel_snapshots (
  id            bigserial primary key,
  channel_id    text not null references public.channels(id) on delete cascade,
  collected_at  timestamptz not null default now(),
  subscribers   bigint,
  total_views   bigint,
  video_count   integer,
  unique (channel_id, collected_at)
);

create index if not exists channel_snapshots_channel_date_idx
  on public.channel_snapshots (channel_id, collected_at desc);

-- ============================================================================
-- videos: 영상 마스터 (쇼츠 위주)
-- ============================================================================
create table if not exists public.videos (
  id               text primary key,            -- video_id
  channel_id       text not null references public.channels(id) on delete cascade,
  title            text not null,
  thumbnail        text,
  published_at     timestamptz,
  duration_seconds integer default 0,
  is_short         boolean default false,
  views            bigint default 0,
  likes            bigint default 0,
  comments         bigint default 0,
  category_id      text,
  collected_at     timestamptz default now(),
  updated_at       timestamptz default now()
);

create index if not exists videos_channel_idx
  on public.videos (channel_id);
create index if not exists videos_published_idx
  on public.videos (published_at desc);
create index if not exists videos_views_idx
  on public.videos (views desc);
create index if not exists videos_short_views_idx
  on public.videos (is_short, views desc);
create index if not exists videos_recent_short_views_idx
  on public.videos (is_short, published_at desc, views desc);

-- ============================================================================
-- collection_logs: 수집 작업 이력 (운영 모니터링용)
-- ============================================================================
create table if not exists public.collection_logs (
  id                 bigserial primary key,
  job_type           text not null,             -- channels_refresh/videos_refresh/discovery/snapshot
  started_at         timestamptz default now(),
  finished_at        timestamptz,
  status             text default 'running',    -- running/success/failed
  channels_processed integer default 0,
  videos_processed   integer default 0,
  api_units_used     integer default 0,
  error_message      text
);

create index if not exists collection_logs_started_idx
  on public.collection_logs (started_at desc);

-- ============================================================================
-- RLS: 모든 접근은 service_role (secret key) 전용. 일반 클라이언트 차단.
-- ============================================================================
alter table public.channels          enable row level security;
alter table public.channel_snapshots enable row level security;
alter table public.videos            enable row level security;
alter table public.collection_logs   enable row level security;

-- (alter default privileges는 03_grants.sql에서 이미 service_role에 부여됨 — 자동 적용)
