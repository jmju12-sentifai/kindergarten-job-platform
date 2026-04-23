-- =============================================
-- 교집합 Schema Migration v6 — Client Revisions
-- 2026-04 클라이언트 피드백 17개 항목 반영
-- =============================================

-- ============================================================================
-- S1. 48h 락: postings.locked_until → institution_profiles.last_posting_locked_until
-- 삭제와 무관하게 락 유지하기 위해 기관 테이블로 이전
-- ============================================================================
alter table public.institution_profiles
  add column if not exists last_posting_locked_until timestamptz;

-- 기존 posting 의 락 값을 기관으로 이관
update public.institution_profiles ip
set last_posting_locked_until = p.locked_until
from public.postings p
where p.institution_id = ip.id
  and p.locked_until is not null
  and p.locked_until > now();

-- postings.locked_until 은 역할 중복이므로 제거
alter table public.postings
  drop column if exists locked_until;

-- ============================================================================
-- S2. 주소 분리: region / sigungu / gu 3컬럼
-- ============================================================================
alter table public.institution_profiles
  add column if not exists address_region   text,
  add column if not exists address_sigungu  text,
  add column if not exists address_gu       text;

-- 기존 address 를 공백 기준 파싱
-- 주의: "서울특별시 강남구 역삼동 123" 같이 3번째가 "구" 가 아닌 동/읍/면일 수 있음
-- 3번째 토막이 "구|군" 으로 끝나는 경우만 address_gu 로 저장
update public.institution_profiles
set
  address_region = split_part(address, ' ', 1),
  address_sigungu = split_part(address, ' ', 2),
  address_gu = case
    when split_part(address, ' ', 3) ~ '(구|군)$' then split_part(address, ' ', 3)
    else null
  end
where address is not null;

-- address_short 재계산: region + sigungu + gu(있으면)
update public.institution_profiles
set address_short = trim(concat_ws(' ',
  address_region,
  address_sigungu,
  address_gu
))
where address_region is not null;

-- ============================================================================
-- S3. 자격증: issuer 제거 + name 정규화
-- 고정 옵션: 유치원 정교사 2급/1급, 유치원 원감, 유치원 원장, 보육교사
-- 매칭 안 되는 값은 '기타'로 간주하고 입력값 그대로 보존
-- ============================================================================
update public.resumes
set certificates = (
  select coalesce(jsonb_agg(
    case
      when c->>'name' ~* '유치원.*정교사.*2' then jsonb_build_object('name', '유치원 정교사 2급')
      when c->>'name' ~* '유치원.*정교사.*1' then jsonb_build_object('name', '유치원 정교사 1급')
      when c->>'name' ~* '유치원.*원감'      then jsonb_build_object('name', '유치원 원감')
      when c->>'name' ~* '유치원.*원장'      then jsonb_build_object('name', '유치원 원장')
      when c->>'name' ~* '보육교사'          then jsonb_build_object('name', '보육교사')
      else jsonb_build_object('name', c->>'name')
    end
  ), '[]'::jsonb)
  from jsonb_array_elements(certificates) as c
)
where jsonb_typeof(certificates) = 'array' and jsonb_array_length(certificates) > 0;

-- ============================================================================
-- S4. 학력 3필드 (university_name / major / degree_years)
-- 기존 teacher_profiles.university / affiliation 에서 이관
-- ============================================================================
alter table public.resumes
  add column if not exists university_name text,
  add column if not exists major           text,
  add column if not exists degree_years    int check (degree_years in (2, 3, 4));

-- teacher_profiles.university 값을 resumes.university_name 으로 이관 (가능한 경우)
update public.resumes r
set university_name = tp.university
from public.teacher_profiles tp
where r.teacher_id = tp.id
  and tp.university is not null
  and r.university_name is null;

-- ============================================================================
-- S5. 이력서 경력: experiences.description 필드 제거
-- ============================================================================
update public.resumes
set experiences = (
  select coalesce(jsonb_agg(e - 'description'), '[]'::jsonb)
  from jsonb_array_elements(experiences) as e
)
where jsonb_typeof(experiences) = 'array' and jsonb_array_length(experiences) > 0;

-- ============================================================================
-- S6. 지원서 viewed_at (확인/미확인 플래그)
-- ============================================================================
alter table public.applications
  add column if not exists viewed_at timestamptz;
-- NULL = 미확인, not NULL = 확인(기관이 해당 시점에 이력서 열람)

-- ============================================================================
-- S7. 모집 포지션 enum 확장
-- 기존: 원감 / 담임교사 / 보조교사 / 방과후교사 / 특별활동강사
-- 신규: 원감 / 담임교사 / 부담임+방과후교사 / 방과후교사 / 단기대체교사
-- ============================================================================

-- 기존 체크 제약 제거
alter table public.position_entries
  drop constraint if exists position_entries_position_check;

-- 기존 값 매핑
update public.position_entries
set position = '부담임+방과후교사'
where position = '보조교사';

update public.position_entries
set position = '단기대체교사'
where position = '특별활동강사';

-- 신규 체크 제약
alter table public.position_entries
  add constraint position_entries_position_check check (
    position in ('원감', '담임교사', '부담임+방과후교사', '방과후교사', '단기대체교사')
  );

-- ============================================================================
-- S8. 공고 생성 RPC: posting insert + institution.last_posting_locked_until 업데이트
-- 트랜잭션 안전성 보장
-- ============================================================================
create or replace function public.create_posting_with_lock(
  p_title text,
  p_description text,
  p_deadline date,
  p_commute_areas text[]
)
returns uuid as $$
declare
  v_posting_id uuid;
  v_lock_until timestamptz;
begin
  -- 현재 락 체크
  select last_posting_locked_until into v_lock_until
  from public.institution_profiles
  where id = auth.uid();

  if v_lock_until is not null and v_lock_until > now() then
    raise exception 'POSTING_LOCKED' using detail = v_lock_until::text;
  end if;

  -- posting 생성
  insert into public.postings (institution_id, title, description, deadline, commute_areas)
  values (auth.uid(), p_title, p_description, p_deadline, p_commute_areas)
  returning id into v_posting_id;

  -- 기관의 락 만료시각 갱신
  update public.institution_profiles
  set last_posting_locked_until = now() + interval '48 hours'
  where id = auth.uid();

  return v_posting_id;
end;
$$ language plpgsql security definer;
