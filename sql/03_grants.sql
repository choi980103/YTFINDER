-- service_role(=Secret key)에 어드민 테이블 전체 권한 부여
-- "자동 노출 OFF" 설정 시 신규 테이블에 권한 자동 부여 안 됨 → 수동 GRANT 필요
-- 실행: Supabase 대시보드 → SQL Editor → New query → 붙여넣고 RUN

grant usage on schema public to service_role;
grant all on public.access_codes to service_role;
grant all on public.orders        to service_role;

-- 앞으로 public 스키마에 새 테이블 만들 때도 자동으로 service_role 권한 부여
alter default privileges in schema public grant all on tables    to service_role;
alter default privileges in schema public grant all on sequences to service_role;

-- 확인
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('access_codes', 'orders')
  and grantee = 'service_role'
order by table_name, privilege_type;
