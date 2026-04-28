import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase-server';
import { createAdminClient } from '@/lib/supabase-admin';

type Role = 'teacher' | 'institution';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') as Role | null;
  const oauthError = searchParams.get('error');
  const oauthErrorDesc = searchParams.get('error_description');

  const log = (msg: string, extra?: unknown) => {
    console.log(`[auth/callback] ${msg}`, extra ?? '');
  };

  log('hit', { hasCode: !!code, role, oauthError, oauthErrorDesc });

  if (oauthError) {
    log('oauth_error_from_provider', { oauthError, oauthErrorDesc });
    return NextResponse.redirect(`${origin}/login?error=oauth_failed`);
  }
  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const supabase = await createServerSupabase();

  const { data: exchange, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !exchange.user) {
    log('exchange_failed', { message: exchangeError?.message });
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const user = exchange.user;
  const userEmail = user.email;
  log('exchange_ok', { userId: user.id, email: userEmail });

  if (!userEmail) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(user.id);
    } catch (e) {
      log('admin_delete_failed', { error: (e as Error).message });
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_email`);
  }

  // 자동 링킹 감지: 기존 이메일/다른 OAuth 유저에 kakao identity가 추가된 경우.
  // Supabase는 email이 같은 기존 유저에 신규 provider identity를 자동 연결함.
  // 이 경우 user.id는 기존 유저의 id이고, identities에는 kakao 외 identity가 공존함.
  const identities = (user.identities ?? []) as { provider: string }[];
  const hasPriorIdentity = identities.some((i) => i.provider !== 'kakao');
  log('identities', { count: identities.length, providers: identities.map((i) => i.provider) });

  if (hasPriorIdentity) {
    log('auto_link_blocked', { userId: user.id, email: userEmail });
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=email_exists`);
  }

  // 혹시 모르니 profiles 기준 이메일 중복도 보조 체크 (트리거로 new profile 생성된 상황 대비)
  const { data: emailConflict, error: conflictError } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .neq('id', user.id)
    .maybeSingle();

  if (conflictError) log('conflict_query_error', { message: conflictError.message });

  if (emailConflict) {
    log('email_conflict_profiles', { conflictId: emailConflict.id });
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(user.id);
    } catch (e) {
      log('admin_delete_failed', { error: (e as Error).message });
    }
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=email_exists`);
  }

  // 방어적 보정: handle_new_user 트리거가 누락/실패한 계정 대비.
  // ignoreDuplicates=true → 이미 있으면 no-op, 없으면 user_type='teacher' 기본으로 INSERT.
  // (실제 user_type은 아래 role 분기 또는 sub-profile 기준 보정 단계에서 맞춰진다)
  const { error: upsertErr } = await supabase
    .from('profiles')
    .upsert(
      { id: user.id, email: userEmail, user_type: role ?? 'teacher' },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  if (upsertErr) log('profile_upsert_failed', { message: upsertErr.message });

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) log('profile_query_error', { message: profileError.message });

  const isValidRole = role === 'teacher' || role === 'institution';

  if (isValidRole) {
    // 회원가입 진입: 이미 어떤 유형으로든 가입을 마친 사용자(서브 프로필 존재)면 차단.
    const [{ data: teacherSub }, { data: instSub }] = await Promise.all([
      supabase.from('teacher_profiles').select('id').eq('id', user.id).maybeSingle(),
      supabase.from('institution_profiles').select('id').eq('id', user.id).maybeSingle(),
    ]);

    if (teacherSub || instSub) {
      log('already_registered_block', { teacher: !!teacherSub, institution: !!instSub });
      await supabase.auth.signOut();
      return NextResponse.redirect(`${origin}/signup/${role}?error=already_registered`);
    }

    // 신규 또는 미완료 가입: 선택한 role로 user_type 정렬 후 가입 폼 진입.
    if (!profile || profile.user_type !== role) {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ user_type: role })
        .eq('id', user.id);
      if (updErr) log('user_type_update_failed', { message: updErr.message });
    }
    log('redirect_role_branch', { target: `/signup/${role}?kakao=1` });
    return NextResponse.redirect(`${origin}/signup/${role}?kakao=1`);
  }

  // 로그인 진입(role 미지정): 양쪽 sub-profile을 모두 확인.
  // profile.user_type을 신뢰하지 않는 이유: 과거 데이터 상태에 따라 user_type이
  // sub-profile과 어긋날 수 있고, 한쪽만 보면 잘못 /signup으로 보낼 수 있다.
  const [{ data: teacherSubLogin }, { data: instSubLogin }] = await Promise.all([
    supabase.from('teacher_profiles').select('id').eq('id', user.id).maybeSingle(),
    supabase.from('institution_profiles').select('id').eq('id', user.id).maybeSingle(),
  ]);
  const hasAnySub = !!(teacherSubLogin || instSubLogin);

  // user_type이 실제 sub와 어긋나면 보정 (mypage 분기 정확도 보장).
  const correctType: Role | null = teacherSubLogin
    ? 'teacher'
    : instSubLogin
      ? 'institution'
      : null;
  if (correctType && profile?.user_type !== correctType) {
    const { error: fixErr } = await supabase
      .from('profiles')
      .update({ user_type: correctType })
      .eq('id', user.id);
    if (fixErr) log('user_type_realign_failed', { message: fixErr.message });
    else log('user_type_realigned', { to: correctType });
  }

  const target = hasAnySub ? '/' : '/signup?kakao=1';
  log('redirect_login_branch', {
    target,
    profileUserType: profile?.user_type,
    teacherSub: !!teacherSubLogin,
    instSub: !!instSubLogin,
  });
  return NextResponse.redirect(`${origin}${target}`);
}
