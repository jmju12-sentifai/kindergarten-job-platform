'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile, TeacherProfile, InstitutionProfile } from '@/types/database';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  teacherProfile: TeacherProfile | null;
  institutionProfile: InstitutionProfile | null;
  hasResume: boolean;
  hasPosting: boolean;
  loading: boolean;
  profileLoaded: boolean;
}

interface AuthContextType extends AuthState {
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    profile: null,
    teacherProfile: null,
    institutionProfile: null,
    hasResume: false,
    hasPosting: false,
    loading: true,
    profileLoaded: false,
  });

  const supabase = createClient();
  const initializedRef = useRef(false);
  // onAuthStateChange 핸들러가 최신 state를 참조하기 위한 ref (closure capture 회피).
  const stateRef = useRef(state);
  stateRef.current = state;

  const fetchProfile = useCallback(async (userId: string) => {
    const empty = { profile: null, teacherProfile: null, institutionProfile: null, hasResume: false, hasPosting: false };

    // profiles 행은 auth 트리거(handle_new_user)로 자동 생성되어야 하지만,
    // 트리거 누락/실패 케이스가 관측됐다 (콘솔 406 = no row).
    // 1) 짧은 재시도로 일시적 동기화 race 흡수
    // 2) 그래도 없으면 방어적 upsert로 자가 복구 (callback이 안 도는 이메일 로그인 경로 대비)
    async function fetchProfileRow() {
      for (let attempt = 1; attempt <= 3; attempt++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        if (data) return data;
        console.log('[AuthContext] fetchProfile attempt', attempt, { hasData: !!data, error: error?.message });
        if (attempt < 3) await new Promise((r) => setTimeout(r, 250 * attempt));
      }

      // Fallback: profile 행이 정말 없음 → 현재 인증된 사용자 기준으로 자가 생성.
      console.log('[AuthContext] fetchProfile fallback: self-heal upsert');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: inserted, error: insertErr } = await supabase
        .from('profiles')
        .upsert(
          { id: user.id, email: user.email ?? '', user_type: 'teacher' },
          { onConflict: 'id' }
        )
        .select('*')
        .maybeSingle();
      if (insertErr) console.log('[AuthContext] fetchProfile upsert failed', insertErr.message);
      return inserted ?? null;
    }

    const run = async () => {
      try {
        const profile = await fetchProfileRow();
        if (!profile) return empty;

        let teacherProfile: TeacherProfile | null = null;
        let institutionProfile: InstitutionProfile | null = null;
        let hasResume = false;
        let hasPosting = false;

        if (profile.user_type === 'teacher') {
          const { data } = await supabase.from('teacher_profiles').select('*').eq('id', userId).maybeSingle();
          teacherProfile = data;
          const { count } = await supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('teacher_id', userId);
          hasResume = (count ?? 0) > 0;
        } else if (profile.user_type === 'institution') {
          const { data } = await supabase.from('institution_profiles').select('*').eq('id', userId).maybeSingle();
          institutionProfile = data;
          const { count } = await supabase.from('postings').select('id', { count: 'exact', head: true }).eq('institution_id', userId).is('archived_at', null);
          hasPosting = (count ?? 0) > 0;
        }

        return { profile, teacherProfile, institutionProfile, hasResume, hasPosting };
      } catch (e) {
        console.log('[AuthContext] fetchProfile error', (e as Error)?.message);
        return empty;
      }
    };

    // 안전망: 8초 안에 응답 없으면 empty로 fallback (재시도 합쳐서 충분히 기다림).
    const timeout = new Promise<typeof empty>((resolve) => setTimeout(() => resolve(empty), 8000));
    return Promise.race([run(), timeout]);
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const profiles = await fetchProfile(user.id);
    setState((prev) => ({ ...prev, user, ...profiles, profileLoaded: true }));
  }, [supabase, fetchProfile]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 안전망: getSession이 비정상적으로 hang하면 8초 후 loading 해제.
    // 정상 케이스에서는 절대 트리거되지 않음 (proxy가 쿠키를 미리 갱신해두므로
    // 클라 getSession은 거의 즉시 응답한다).
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (prev.loading) return { ...prev, loading: false, profileLoaded: true };
        return prev;
      });
    }, 8000);

    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      const session = data.session;
      clearTimeout(timeout);
      if (typeof window !== 'undefined') {
        const sbCookies = document.cookie.split(';').map((c) => c.trim().split('=')[0]).filter((n) => n.startsWith('sb-'));
        console.log('[AuthContext] getSession', { hasSession: !!session, userId: session?.user?.id, sbCookies });
      }

      if (session?.user) {
        setState((prev) => ({ ...prev, user: session.user, session, loading: false }));
        // 프로필은 백그라운드
        const profiles = await fetchProfile(session.user.id);
        setState((prev) => ({ ...prev, ...profiles, profileLoaded: true }));
      } else {
        setState((prev) => ({ ...prev, loading: false, profileLoaded: true }));
      }
    }).catch((e: unknown) => {
      clearTimeout(timeout);
      if (typeof window !== 'undefined') {
        console.log('[AuthContext] getSession error', (e as Error)?.message);
      }
      setState((prev) => ({ ...prev, loading: false, profileLoaded: true }));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        console.log('[AuthContext] onAuthStateChange', { event, hasUser: !!session?.user });
        if (event === 'SIGNED_IN' && session?.user) {
          // 카카오 콜백 후 페이지 하드 리로드되면 getSession 경로가 먼저 fetchProfile을
          // 끝낸 상태인데, 곧이어 SIGNED_IN까지 발화해 동일 사용자에 대해
          // 또 fetchProfile을 돌리며 profileLoaded를 false로 잠깐 리셋한다.
          // 그 순간 mypage가 profile=null로 오인하고 /signup으로 보내는 race가 발생.
          // 같은 사용자 + profile 이미 로드된 상태면 재요청을 건너뛴다.
          const current = stateRef.current;
          if (current.user?.id === session.user.id && current.profileLoaded && current.profile) {
            console.log('[AuthContext] SIGNED_IN skip refetch (same user, profile loaded)');
            setState((prev) => ({ ...prev, session, loading: false }));
            return;
          }
          setState((prev) => ({ ...prev, user: session.user, session, loading: false, profileLoaded: false }));
          const profiles = await fetchProfile(session.user.id);
          console.log('[AuthContext] SIGNED_IN profile', { hasProfile: !!profiles.profile, userType: profiles.profile?.user_type });
          setState((prev) => ({ ...prev, ...profiles, profileLoaded: true }));
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null, session: null, profile: null,
            teacherProfile: null, institutionProfile: null,
            hasResume: false, hasPosting: false, loading: false, profileLoaded: true,
          });
        }
      }
    );

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    // scope: 'local' → 서버 호출 없이 브라우저 세션만 정리 (서버 hang 회피)
    const signOutPromise = supabase.auth.signOut({ scope: 'local' });
    const timeout = new Promise<{ error: null }>((resolve) =>
      setTimeout(() => resolve({ error: null }), 2000)
    );
    await Promise.race([signOutPromise, timeout]);

    // 방어적으로 남아있는 sb-*-auth-token 쿠키 직접 제거
    try {
      document.cookie.split(';').forEach((c) => {
        const name = c.trim().split('=')[0];
        if (name.startsWith('sb-')) {
          document.cookie = `${name}=; path=/; max-age=0`;
        }
      });
    } catch {
      // ignore
    }

    // 로컬 상태 즉시 초기화 (onAuthStateChange 대기하지 않음)
    setState({
      user: null, session: null, profile: null,
      teacherProfile: null, institutionProfile: null,
      hasResume: false, hasPosting: false, loading: false, profileLoaded: true,
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
