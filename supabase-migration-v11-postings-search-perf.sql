-- ============================================================================
-- v11. /jobs 목록 성능 개선 — 인덱스 + 통합 검색 RPC
-- ----------------------------------------------------------------------------
-- 배경:
--   /jobs 는 활성 공고 (archived_at IS NULL) 중 deadline >= 한달전 조건으로
--   created_at DESC 정렬해 가져오는데, 인덱스가 없어 매 요청마다 seq scan + sort.
--   또한 limit 없이 전체를 클라로 보내고 클라에서 필터링하느라 페이로드가 비대.
--
-- 신규:
--   1) 활성 공고 전용 부분 인덱스 (created_at, deadline)
--   2) position_entries.position 인덱스 — 직군 필터용
--   3) search_active_postings(...) RPC — 통합 검색/필터/페이지네이션
--      - security invoker → 기존 RLS(Public read) 그대로 적용
--      - region/검색어가 commute_areas(상위) 와 institution_profiles.address(하위)
--        양쪽에 걸리는 OR 조건이라 PostgREST 단일 OR로 표현 불가 → RPC 로 일원화.
--      - 반환은 setof public.postings 라 PostgREST embedding(.select) 사용 가능.
-- ============================================================================

-- 1) 활성 공고 정렬 인덱스
create index if not exists postings_active_created_idx
  on public.postings (created_at desc)
  where archived_at is null;

-- 2) 활성 공고 마감일 인덱스 (deadline 정렬/필터)
create index if not exists postings_active_deadline_idx
  on public.postings (deadline)
  where archived_at is null;

-- 3) 직군 필터용 인덱스
create index if not exists position_entries_position_idx
  on public.position_entries (position);

-- 4) 통합 검색 RPC
create or replace function public.search_active_postings(
  p_search text default null,
  p_region text default null,
  p_sub_region text default null,
  p_position text default null,
  p_sort text default 'latest',
  p_limit int default 30,
  p_offset int default 0
)
returns setof public.postings
language sql
stable
security invoker
as $$
  select p.*
  from public.postings p
  inner join public.institution_profiles ip on ip.id = p.institution_id
  where p.archived_at is null
    and p.deadline >= (current_date - interval '1 month')::date
    and (
      p_search is null or p_search = '' or
      p.title ilike '%' || p_search || '%' or
      ip.name  ilike '%' || p_search || '%' or
      ip.address ilike '%' || p_search || '%'
    )
    and (
      p_region is null or p_region = '' or
      ip.address ilike '%' || p_region || '%' or
      exists (
        select 1 from unnest(coalesce(p.commute_areas, '{}'::text[])) c
        where c ilike '%' || p_region || '%'
      )
    )
    and (
      p_sub_region is null or p_sub_region = '' or
      ip.address ilike '%' || p_sub_region || '%' or
      exists (
        select 1 from unnest(coalesce(p.commute_areas, '{}'::text[])) c
        where c ilike '%' || p_sub_region || '%'
      )
    )
    and (
      p_position is null or p_position = '' or
      exists (
        select 1 from public.position_entries pe
        where pe.posting_id = p.id and pe.position = p_position
      )
    )
  order by
    case when p_sort = 'deadline' then p.deadline end asc nulls last,
    case when p_sort = 'deadline' then null         else p.created_at end desc
  limit  greatest(1, least(coalesce(p_limit, 30), 100))
  offset greatest(0, coalesce(p_offset, 0));
$$;

-- 5) 호출 권한 — RLS 는 invoker 모드라 그대로 적용됨
grant execute on function public.search_active_postings(
  text, text, text, text, text, int, int
) to anon, authenticated;
