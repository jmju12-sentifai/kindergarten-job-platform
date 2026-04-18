-- =============================================
-- 교집합 Schema Migration v2
-- 기존 스키마 실행 후 이것도 실행하세요
-- =============================================

-- 기관 프로필: 가까운역 추가
alter table public.institution_profiles
  add column if not exists nearby_stations text[] default '{}';

-- 구직자 프로필: 졸업대학, 소유자격 추가
alter table public.teacher_profiles
  add column if not exists university text,
  add column if not exists certificates jsonb default '[]';

-- 공고: 수정 잠금 시간 + 자동 마감
alter table public.postings
  add column if not exists locked_until timestamptz;
-- locked_until = created_at + 48h. 이 시간 전에는 수정 불가.
-- deadline 이후 1개월 지나면 공고 미노출 (앱에서 필터)
