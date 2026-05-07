-- ============================================================================
-- v9. 교사 재지원 RLS 정책
-- ----------------------------------------------------------------------------
-- 배경:
--   - applications 테이블에 unique (position_entry_id, teacher_id) 제약 존재.
--   - v7에서 지원취소를 행 삭제 대신 status='지원취소' update 로 처리하도록 변경.
--   - 결과적으로 같은 포지션에 다시 지원하려 해도 INSERT 시 unique 충돌.
--   - v7의 "Teacher cancel own" 정책은 status='지원취소'로만 update 허용하므로
--     클라이언트에서 status='검토중'으로 되돌리는 UPDATE 도 RLS 에 막힘.
--
-- 신규:
--   - 본인 row 중 현재 '지원취소' 상태인 것에 한해 '검토중'으로 되돌리기 허용.
--   - using 으로 대상 row를 본인 + 지원취소 상태로 한정.
--   - with check 로 변경 후 status='검토중' 만 허용 → 다른 상태로의 변조 차단.
--   - 검토중/면접요청/합격/불합격 상태인 row 는 이 정책에 매칭되지 않으므로
--     교사가 그 상태를 임의로 바꿀 수 없음.
-- ============================================================================
drop policy if exists "Teacher reapply own" on public.applications;
create policy "Teacher reapply own" on public.applications for update
  using (auth.uid() = teacher_id and status = '지원취소')
  with check (auth.uid() = teacher_id and status = '검토중');
