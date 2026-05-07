import crypto from 'crypto';
import { createAdminClient } from '@/lib/supabase-admin';
import type { KakaoDispatchStatus } from '@/types/database';

// 서버 전용. 절대 클라이언트 번들에 포함되면 안 됨 (API_SECRET 누출).
// 호출 위치는 /api/kakao/send route handler 한 곳으로 집중한다.

const SOLAPI_BASE = 'https://api.solapi.com';

export type AlimtalkTemplateCode = 'APP_RECEIVED' | 'APP_CANCELLED';

const TEMPLATE_ID_BY_CODE: Record<AlimtalkTemplateCode, string | undefined> = {
  APP_RECEIVED: process.env.SOLAPI_TEMPLATE_APP_RECEIVED,
  APP_CANCELLED: process.env.SOLAPI_TEMPLATE_APP_CANCELLED,
};

export interface SendArgs {
  templateCode: AlimtalkTemplateCode;
  phone: string;                        // raw 입력 (대시 포함 가능)
  variables: Record<string, string>;    // 템플릿 변수 매핑. 키는 '#{기관명}' 같은 풀 폼.
  institutionId?: string | null;
  applicationId?: string | null;
}

interface DispatchLogInsert {
  template_code: AlimtalkTemplateCode;
  recipient_phone: string;
  recipient_institution_id: string | null;
  application_id: string | null;
  variables: Record<string, string>;
  status: KakaoDispatchStatus;
  vendor_message_id?: string | null;
  error_message?: string | null;
}

// supabase-js v2.103 의 strict 제네릭이 untyped admin 클라이언트에서 새 테이블에 대해
// schema 를 never 로 해석하는 이슈가 있어, insert 호출만 격리해 캐스트한다.
async function insertDispatchLog(payload: DispatchLogInsert): Promise<void> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from('kakao_dispatch_log') as any).insert(payload);
}

// 한국 휴대폰: 010/011/016/017/018/019 + 7~8자리 = 총 10~11자리
function normalizePhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, '');
  if (/^01[0-9]\d{7,8}$/.test(digits)) return digits;
  return null;
}

function buildAuthHeader(apiKey: string, apiSecret: string): string {
  const date = new Date().toISOString();
  const salt = crypto.randomBytes(32).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(date + salt)
    .digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`;
}

/**
 * 알림톡 발송. fire-and-forget — 실패해도 throw 하지 않음.
 * - 휴대폰 형식 안 맞으면 'skipped_invalid_phone'로 로그하고 종료.
 * - 환경변수 미설정이면 (예: 로컬·CI) 조용히 종료. 로그도 남기지 않음.
 * - 그 외 모든 결과(성공/실패)는 kakao_dispatch_log 에 기록.
 */
export async function sendAlimtalk(args: SendArgs): Promise<void> {
  const { templateCode, phone, variables, institutionId = null, applicationId = null } = args;

  const apiKey = process.env.SOLAPI_API_KEY;
  const apiSecret = process.env.SOLAPI_API_SECRET;
  const pfId = process.env.SOLAPI_PFID;
  const templateId = TEMPLATE_ID_BY_CODE[templateCode];

  if (!apiKey || !apiSecret || !pfId || !templateId) {
    console.warn('[solapi] env not configured, skip', { templateCode });
    return;
  }

  const normalized = normalizePhone(phone);
  if (!normalized) {
    await insertDispatchLog({
      template_code: templateCode,
      recipient_phone: phone,
      recipient_institution_id: institutionId,
      application_id: applicationId,
      variables,
      status: 'skipped_invalid_phone',
    });
    return;
  }

  try {
    const res = await fetch(`${SOLAPI_BASE}/messages/v4/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: buildAuthHeader(apiKey, apiSecret),
      },
      body: JSON.stringify({
        message: {
          to: normalized,
          kakaoOptions: {
            pfId,
            templateId,
            variables,
            disableSms: true, // SMS 폴백 비활성화 (발신번호 등록 미완 안전 가드)
          },
        },
      }),
    });

    type SolapiResponse = { statusCode?: string; messageId?: string; [k: string]: unknown };
    const json: SolapiResponse = await res.json().catch(() => ({} as SolapiResponse));
    // Solapi v4: 정상 접수 시 statusCode '2000' 또는 HTTP 200
    const ok = res.ok && (json.statusCode === '2000' || /^2/.test(String(json.statusCode ?? '')));

    await insertDispatchLog({
      template_code: templateCode,
      recipient_phone: normalized,
      recipient_institution_id: institutionId,
      application_id: applicationId,
      variables,
      status: ok ? 'sent' : 'failed',
      vendor_message_id: json.messageId ?? null,
      error_message: ok ? null : JSON.stringify(json).slice(0, 500),
    });
  } catch (e) {
    await insertDispatchLog({
      template_code: templateCode,
      recipient_phone: normalized,
      recipient_institution_id: institutionId,
      application_id: applicationId,
      variables,
      status: 'failed',
      error_message: e instanceof Error ? e.message.slice(0, 500) : 'unknown',
    });
  }
}
