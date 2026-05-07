-- ============================================================================
-- v10. postings.institution_id unique 제약 → 활성 공고 기준 부분 unique 로 변경
-- ----------------------------------------------------------------------------
-- 배경:
--   - 초기 스키마는 institution_id 에 unique 컬럼 제약 → 기관당 공고 1개.
--   - v7에서 공고 삭제를 archived_at 기반 soft delete 로 바꿨지만 unique 제약은
--     그대로라, 보관(archived) 된 옛 공고가 있는 기관은 새 공고 INSERT 시
--     unique 충돌로 실패. ("공고 등록 중 오류가 발생했습니다")
--
-- 신규:
--   - 옛 unique 제약 제거.
--   - archived_at IS NULL 인 row 들 사이에서만 unique 강제하는 부분 인덱스 생성.
--   - 활성 공고는 기관당 1개 비즈니스 규칙은 유지. 보관된 옛 row 는 영향 없음.
--
-- 안전하게: 제약 이름이 환경에 따라 다를 수 있으므로 pg_constraint 에서 조회 후 drop.
-- ============================================================================
do $$
declare
  cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid = 'public.postings'::regclass
    and contype = 'u'
    and conkey = (
      select array[attnum]::int2[]
      from pg_attribute
      where attrelid = 'public.postings'::regclass
        and attname = 'institution_id'
    );
  if cname is not null then
    execute format('alter table public.postings drop constraint %I', cname);
  end if;
end $$;

create unique index if not exists postings_active_institution_unique
  on public.postings (institution_id)
  where archived_at is null;
