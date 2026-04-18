import { useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase';

interface ValidationState {
  emailStatus: 'idle' | 'checking' | 'available' | 'taken' | 'invalid';
  passwordValid: boolean;
  passwordMatch: boolean;
}

export function useFieldValidation() {
  const [state, setState] = useState<ValidationState>({
    emailStatus: 'idle',
    passwordValid: false,
    passwordMatch: false,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const checkEmail = useCallback((email: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!email.trim()) {
      setState((s) => ({ ...s, emailStatus: 'idle' }));
      return;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setState((s) => ({ ...s, emailStatus: 'invalid' }));
      return;
    }

    setState((s) => ({ ...s, emailStatus: 'checking' }));

    debounceRef.current = setTimeout(async () => {
      const supabase = createClient();
      // profiles 테이블에서 이메일 존재 여부 확인
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('email', email);

      setState((s) => ({
        ...s,
        emailStatus: (count ?? 0) > 0 ? 'taken' : 'available',
      }));
    }, 600);
  }, []);

  const checkPassword = useCallback((password: string) => {
    setState((s) => ({ ...s, passwordValid: password.length >= 8 }));
  }, []);

  const checkPasswordMatch = useCallback((password: string, confirm: string) => {
    setState((s) => ({ ...s, passwordMatch: confirm.length > 0 && password === confirm }));
  }, []);

  return { ...state, checkEmail, checkPassword, checkPasswordMatch };
}
