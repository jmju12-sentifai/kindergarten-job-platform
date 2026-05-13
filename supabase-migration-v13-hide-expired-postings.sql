-- ============================================================================
-- v13. 만료 공고 공개 목록에서 즉시 숨김
-- 기존: deadline >= current_date - 1 month (만료 후 최대 1달간 노출)
-- 변경: deadline >= current_date (당일 포함, 오늘 이후 마감 공고만 노출)
-- 마이페이지 내 채용공고는 archived_at 기준이라 영향 없음.
-- ============================================================================

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
    and p.deadline >= current_date
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
