import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';
import { sendAlimtalk } from '@/lib/solapi';

// POST /api/kakao/send
// 클라이언트는 지원 INSERT/지원취소 UPDATE 직후 fire-and-forget으로 호출한다.
// 본인의 application 인지 검증 후, 서버 측에서 데이터 join 해 발송.
//
// body: { event: 'received' | 'cancelled', applicationId: string }

interface RequestBody {
  event: 'received' | 'cancelled';
  applicationId: string;
}

interface AppRow {
  id: string;
  teacher_id: string;
  applied_at: string;
  teacher_profiles: { name: string };
  postings: {
    title: string;
    institution_id: string;
    institution_profiles: { name: string; phone: string };
  };
  position_entries: { position: string };
}

function formatKstDateTime(input: string | Date): string {
  const d = typeof input === 'string' ? new Date(input) : input;
  // ko-KR 24h 포맷, KST. 알림톡 본문 표시용.
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(d);
}

export async function POST(req: NextRequest) {
  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  if (
    !body ||
    (body.event !== 'received' && body.event !== 'cancelled') ||
    typeof body.applicationId !== 'string'
  ) {
    return Response.json({ ok: false, error: 'invalid_body' }, { status: 400 });
  }

  // 인증: 본인의 application 만 트리거 가능
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: appRaw } = await admin
    .from('applications')
    .select(
      `
      id, teacher_id, applied_at,
      teacher_profiles!inner(name),
      postings!inner(title, institution_id, institution_profiles!inner(name, phone)),
      position_entries!inner(position)
    `
    )
    .eq('id', body.applicationId)
    .maybeSingle();

  const app = appRaw as unknown as AppRow | null;
  if (!app || app.teacher_id !== user.id) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const inst = app.postings.institution_profiles;
  const teacherName = app.teacher_profiles.name;
  const postingTitle = app.postings.title;
  const position = app.position_entries.position;

  if (body.event === 'received') {
    await sendAlimtalk({
      templateCode: 'APP_RECEIVED',
      phone: inst.phone,
      variables: {
        '#{기관명}': inst.name,
        '#{교사명}': teacherName,
        '#{공고명}': postingTitle,
        '#{지원일시}': formatKstDateTime(app.applied_at),
        '#{포지션}': position,
      },
      institutionId: app.postings.institution_id,
      applicationId: app.id,
    });
  } else {
    await sendAlimtalk({
      templateCode: 'APP_CANCELLED',
      phone: inst.phone,
      variables: {
        '#{기관명}': inst.name,
        '#{교사명}': teacherName,
        '#{공고명}': postingTitle,
        '#{취소일시}': formatKstDateTime(new Date()),
      },
      institutionId: app.postings.institution_id,
      applicationId: app.id,
    });
  }

  return Response.json({ ok: true });
}
