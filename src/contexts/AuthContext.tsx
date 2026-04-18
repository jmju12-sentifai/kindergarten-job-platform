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
  });

  const supabaseRef = useRef(createClient());
  const supabase = supabaseRef.current;

  const fetchProfile = useCallback(async (userId: string, retries = 3): Promise<{
    profile: Profile | null;
    teacherProfile: TeacherProfile | null;
    institutionProfile: InstitutionProfile | null;
    hasResume: boolean;
    hasPosting: boolean;
  }> => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    // 가입 직후 trigger가 아직 안 끝났을 수 있음 → retry
    if (!profile && retries > 0) {
      await new Promise((r) => setTimeout(r, 500));
      return fetchProfile(userId, retries - 1);
    }
    if (!profile) return { profile: null, teacherProfile: null, institutionProfile: null, hasResume: false, hasPosting: false };

    let teacherProfile: TeacherProfile | null = null;
    let institutionProfile: InstitutionProfile | null = null;

    if (profile.user_type === 'teacher') {
      const { data } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      teacherProfile = data;

      // teacher_profiles가 아직 insert 안 됐을 수 있음 → retry
      if (!teacherProfile && retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return fetchProfile(userId, retries - 1);
      }
    } else {
      const { data } = await supabase
        .from('institution_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      institutionProfile = data;

      if (!institutionProfile && retries > 0) {
        await new Promise((r) => setTimeout(r, 500));
        return fetchProfile(userId, retries - 1);
      }
    }

    let hasResume = false;
    let hasPosting = false;
    if (profile.user_type === 'teacher') {
      const { count } = await supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('teacher_id', userId);
      hasResume = (count ?? 0) > 0;
    } else if (profile.user_type === 'institution') {
      // 만료 안 된 공고가 있는지 체크
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const { count } = await supabase.from('postings').select('id', { count: 'exact', head: true })
        .eq('institution_id', userId).gte('deadline', oneMonthAgo.toISOString().split('T')[0]);
      hasPosting = (count ?? 0) > 0;
    }

    return { profile, teacherProfile, institutionProfile, hasResume, hasPosting };
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const profiles = await fetchProfile(user.id);
    setState((prev) => ({ ...prev, user, ...profiles }));
  }, [supabase, fetchProfile]);

  useEffect(() => {
    // 초기 세션 확인
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profiles = await fetchProfile(session.user.id);
        setState({ user: session.user, session, ...profiles, loading: false });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const profiles = await fetchProfile(session.user.id);
          setState({ user: session.user, session, ...profiles, loading: false });
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null, session: null, profile: null,
            teacherProfile: null, institutionProfile: null, hasResume: false, hasPosting: false, loading: false,
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  const signOut = async () => {
    await supabase.auth.signOut();
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
