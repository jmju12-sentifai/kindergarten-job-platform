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

  const supabase = createClient();
  const initializedRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (!profile) return { profile: null, teacherProfile: null, institutionProfile: null, hasResume: false, hasPosting: false };

      let teacherProfile: TeacherProfile | null = null;
      let institutionProfile: InstitutionProfile | null = null;
      let hasResume = false;
      let hasPosting = false;

      if (profile.user_type === 'teacher') {
        const { data } = await supabase.from('teacher_profiles').select('*').eq('id', userId).single();
        teacherProfile = data;
        const { count } = await supabase.from('resumes').select('id', { count: 'exact', head: true }).eq('teacher_id', userId);
        hasResume = (count ?? 0) > 0;
      } else if (profile.user_type === 'institution') {
        const { data } = await supabase.from('institution_profiles').select('*').eq('id', userId).single();
        institutionProfile = data;
        const { count } = await supabase.from('postings').select('id', { count: 'exact', head: true }).eq('institution_id', userId);
        hasPosting = (count ?? 0) > 0;
      }

      return { profile, teacherProfile, institutionProfile, hasResume, hasPosting };
    } catch {
      return { profile: null, teacherProfile: null, institutionProfile: null, hasResume: false, hasPosting: false };
    }
  }, [supabase]);

  const refreshProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const profiles = await fetchProfile(user.id);
    setState((prev) => ({ ...prev, user, ...profiles }));
  }, [supabase, fetchProfile]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    // 최대 3초 안에 반드시 loading 해제
    const timeout = setTimeout(() => {
      setState((prev) => {
        if (prev.loading) return { ...prev, loading: false };
        return prev;
      });
    }, 3000);

    supabase.auth.getSession().then(async ({ data }: { data: { session: Session | null } }) => {
      const session = data.session;
      clearTimeout(timeout);

      if (session?.user) {
        setState((prev) => ({ ...prev, user: session.user, session, loading: false }));
        // 프로필은 백그라운드
        const profiles = await fetchProfile(session.user.id);
        setState((prev) => ({ ...prev, ...profiles }));
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    }).catch(() => {
      clearTimeout(timeout);
      setState((prev) => ({ ...prev, loading: false }));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: Session | null) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setState((prev) => ({ ...prev, user: session.user, session, loading: false }));
          const profiles = await fetchProfile(session.user.id);
          setState((prev) => ({ ...prev, ...profiles }));
        } else if (event === 'SIGNED_OUT') {
          setState({
            user: null, session: null, profile: null,
            teacherProfile: null, institutionProfile: null,
            hasResume: false, hasPosting: false, loading: false,
          });
        }
      }
    );

    return () => { clearTimeout(timeout); subscription.unsubscribe(); };
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
