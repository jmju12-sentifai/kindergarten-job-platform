-- 교집합 Schema Migration v5
-- 공고에 출퇴근 가능지역 추가
alter table public.postings
  add column if not exists commute_areas text[] default '{}';
