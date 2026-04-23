import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase-admin';

type Role = 'teacher' | 'institution';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const role = searchParams.get('role') as Role | null;
  const oauthError = searchParams.get('error');

  const redirect = (path: string, cookieCarrier?: NextResponse) => {
    const res = NextResponse.redirect(`${origin}${path}`);
    if (cookieCarrier) {
      cookieCarrier.cookies.getAll().forEach((c) => {
        res.cookies.set(c.name, c.value, c);
      });
    }
    return res;
  };

  if (oauthError) return redirect('/login?error=oauth_failed');
  if (!code) return redirect('/login?error=no_code');

  const cookieCarrier = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
        },
        setAll(cookies) {
          cookies.forEach(({ name, value, options }) => {
            cookieCarrier.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return redirect('/login?error=exchange_failed');

  const user = data.user;
  const userEmail = user.email;
  if (!userEmail) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(user.id);
    await supabase.auth.signOut();
    return redirect('/login?error=no_email');
  }

  const { data: emailConflict } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', userEmail)
    .neq('id', user.id)
    .maybeSingle();

  if (emailConflict) {
    const admin = createAdminClient();
    await admin.auth.admin.deleteUser(user.id);
    await supabase.auth.signOut();
    return redirect('/login?error=email_exists');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('user_type')
    .eq('id', user.id)
    .maybeSingle();

  const isValidRole = role === 'teacher' || role === 'institution';

  if (isValidRole) {
    if (profile && profile.user_type !== role) {
      await supabase.from('profiles').update({ user_type: role }).eq('id', user.id);
    }
    const table = role === 'teacher' ? 'teacher_profiles' : 'institution_profiles';
    const { data: sub } = await supabase.from(table).select('id').eq('id', user.id).maybeSingle();
    return redirect(sub ? '/mypage' : `/signup/${role}?kakao=1`, cookieCarrier);
  }

  const currentType = (profile?.user_type ?? 'teacher') as Role;
  const table = currentType === 'teacher' ? 'teacher_profiles' : 'institution_profiles';
  const { data: sub } = await supabase.from(table).select('id').eq('id', user.id).maybeSingle();
  return redirect(sub ? '/mypage' : '/signup?kakao=1', cookieCarrier);
}
