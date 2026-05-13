-- ============================================================================
-- v12. 모집 포지션 enum 확장: '그 외 교사' 추가
-- ============================================================================

alter table public.position_entries
  drop constraint if exists position_entries_position_check;

alter table public.position_entries
  add constraint position_entries_position_check check (
    position in ('원감', '담임교사', '부담임+방과후교사', '방과후교사', '단기대체교사', '그 외 교사')
  );
