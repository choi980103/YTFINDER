-- 기존 ACCESS_CODES env → DB 마이그레이션
-- 실행: 01_schema.sql 실행 후, Supabase SQL Editor에서 RUN

-- 체험판
insert into public.access_codes (code, plan, note)
values ('YTFINDER-FREE-TRIAL', 'free_trial', '체험판 공용 코드')
on conflict (code) do nothing;

-- 얼리버드 (10개) — 일부는 이미 유료 사용자에게 발급됨
-- 유료 사용자 정보는 어드민 UI에서 customer_email/nickname 채울 예정
insert into public.access_codes (code, plan, note) values
  ('YTFINDER-EARLY-001', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-002', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-003', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-004', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-005', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-006', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-007', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-008', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-009', 'early', '얼리버드 코드'),
  ('YTFINDER-EARLY-010', 'early', '얼리버드 코드')
on conflict (code) do nothing;

-- 확인
select code, plan, status, expires_at from public.access_codes order by code;
