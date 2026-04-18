-- =============================================
-- 교집합 Schema Migration v3
-- 회원탈퇴 시 auth.users 삭제를 위한 서버 함수
-- Supabase SQL Editor에서 실행하세요
-- =============================================

create or replace function public.delete_own_account()
returns void as $$
begin
  -- profiles (CASCADE로 하위 데이터 자동 삭제)
  delete from public.profiles where id = auth.uid();
  -- auth.users 삭제 (security definer로 서비스 권한 사용)
  delete from auth.users where id = auth.uid();
end;
$$ language plpgsql security definer;
