import { NextResponse, type NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
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

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // noop
          }
        },
      },
    }
  );

  const { data: exchange, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError || !exchange.user) {
    log('exchange_failed', { message: exchangeError?.message });
    return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
  }

  const user = exchange.user;
  const userEmail = user.email;
  log('exchange_ok', { userId: user.id, email: userEmail });
  log('cookie_names_after_exchange', cookieStore.getAll().map((c) => c.name));

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

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) log('profile_query_error', { message: profileError.message });

  const isValidRole = role === 'teacher' || role === 'institution';

  if (isValidRole) {
    if (profile && profile.user_type !== role) {
      const { error: updErr } = await supabase
        .from('profiles')
        .update({ user_type: role })
        .eq('id', user.id);
      if (updErr) log('user_type_update_failed', { message: updErr.message });
    }
    const table = role === 'teacher' ? 'teacher_profiles' : 'institution_profiles';
    const { data: sub } = await supabase.from(table).select('id').eq('id', user.id).maybeSingle();
    const target = sub ? '/' : `/signup/${role}?kakao=1`;
    log('redirect_role_branch', { target });
    return NextResponse.redirect(`${origin}${target}`);
  }

  const currentType = (profile?.user_type ?? 'teacher') as Role;
  const table = currentType === 'teacher' ? 'teacher_profiles' : 'institution_profiles';
  const { data: sub } = await supabase.from(table).select('id').eq('id', user.id).maybeSingle();
  const target = sub ? '/' : '/signup?kakao=1';
  log('redirect_login_branch', { target, currentType });
  return NextResponse.redirect(`${origin}${target}`);
}
