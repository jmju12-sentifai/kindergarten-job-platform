-- =============================================
-- 교집합 Schema Migration v8 — 카카오 알림톡 발송 이력
-- 2026-05-07 Solapi 알림톡 연동
-- =============================================

-- ============================================================================
-- S1. kakao_dispatch_log
-- 트리거:
--   - APP_RECEIVED  : applications insert 시 기관 담당자에 발송
--   - APP_CANCELLED : applications.status='지원취소' update 시 기관 담당자에 발송
-- 목적: 발송 성공/실패 감사, 디버깅, 운영 중 어떤 기관이 알림 못 받는지 추적
-- 정책: service_role 만 insert/select. 일반 사용자는 접근 불가.
-- ============================================================================
create table if not exists public.kakao_dispatch_log (
  id uuid primary key default gen_random_uuid(),
  template_code text not null,                                       -- 'APP_RECEIVED' | 'APP_CANCELLED'
  recipient_phone text not null,                                     -- 발송 대상 휴대폰 (정규화 후)
  recipient_institution_id uuid references public.institution_profiles(id) on delete set null,
  application_id uuid references public.applications(id) on delete set null,
  variables jsonb not null default '{}'::jsonb,                      -- 템플릿 변수 매핑 결과
  status text not null check (status in ('sent', 'failed', 'skipped_invalid_phone')),
  vendor_message_id text,                                            -- Solapi 측 messageId
  error_message text,                                                -- 실패 시 응답/예외 요약 (≤500자)
  created_at timestamptz not null default now()
);

create index if not exists kakao_dispatch_log_institution_idx
  on public.kakao_dispatch_log (recipient_institution_id, created_at desc);
create index if not exists kakao_dispatch_log_application_idx
  on public.kakao_dispatch_log (application_id);

-- RLS: 기본 차단. service_role만 우회 가능 (Supabase 기본 동작).
alter table public.kakao_dispatch_log enable row level security;
-- 일반 사용자/익명 정책 추가하지 않음 → 모두 차단.
-- (어드민에서 조회 UI 만들 때 별도 정책 추가 예정)
