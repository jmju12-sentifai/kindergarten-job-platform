-- =============================================
-- 교집합 Schema Migration v7 — Client Revisions (2차)
-- 2026-04-28 클라이언트 피드백 12개 항목 중 9개 반영 (#6, #10 제외)
-- =============================================

-- ============================================================================
-- S1. 지원취소 상태 추가
-- 기존: 검토중 / 면접요청 / 합격 / 불합격
-- 신규: 검토중 / 면접요청 / 합격 / 불합격 / 지원취소
-- 교사가 마이페이지에서 지원취소 시 행을 삭제하지 않고 status만 갱신.
-- 이렇게 해야 기관 측에서 "지원취소" 상태를 확인 가능.
-- ============================================================================
alter table public.applications
  drop constraint if exists applications_status_check;

alter table public.applications
  add constraint applications_status_check check (
    status in ('검토중', '면접요청', '합격', '불합격', '지원취소')
  );

-- ============================================================================
-- S2. 공고 soft delete: postings.archived_at
-- 기존: 공고 삭제 시 cascade로 applications 까지 사라져 받은 이력서 열람 불가.
-- 신규: archived_at 세팅으로 소프트 삭제. 공고 노출/지원 차단하되 받은 지원서는
--       마이페이지에서 계속 열람 가능.
-- ============================================================================
alter table public.postings
  add column if not exists archived_at timestamptz;

-- ============================================================================
-- S3. 자격증: issuer(발행기관) 필드 추가, needs_reentry 폐기
-- 기존: { name, needs_reentry? } — 5개 고정 자격증 + '기타' 직접입력
-- 신규: { name, issuer } — 자격증명/발행기관 모두 자유 입력
-- 기존 데이터에 issuer:'' 백필. needs_reentry 키 제거.
-- ============================================================================
update public.resumes
set certificates = (
  select coalesce(jsonb_agg(
    jsonb_build_object('issuer', '') || (c - 'needs_reentry')
  ), '[]'::jsonb)
  from jsonb_array_elements(certificates) as c
)
where jsonb_typeof(certificates) = 'array'
  and jsonb_array_length(certificates) > 0;

update public.teacher_profiles
set certificates = (
  select coalesce(jsonb_agg(
    jsonb_build_object('issuer', '') || (c - 'needs_reentry')
  ), '[]'::jsonb)
  from jsonb_array_elements(certificates) as c
)
where jsonb_typeof(certificates) = 'array'
  and jsonb_array_length(certificates) > 0;

-- ============================================================================
-- S4. 교사 본인 지원취소 RLS 정책
-- 기존 정책엔 "Institution update status"만 있어서 교사가 자기 application 의
-- status 를 '지원취소'로 바꿀 수 없었음. 본인의 row 에 한해 update 허용하되,
-- with check 로 status = '지원취소' 만 가능하게 제한해 다른 상태로의 변조 차단.
-- ============================================================================
drop policy if exists "Teacher cancel own" on public.applications;
create policy "Teacher cancel own" on public.applications for update
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id and status = '지원취소');
