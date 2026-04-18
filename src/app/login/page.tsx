'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { ButtonSpinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';

export default function Login() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleKakao = () => {
    toast('카카오 로그인은 준비 중입니다.', 'info');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      toast('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
      setLoading(false);
      return;
    }

    setLoading(false);
    toast('로그인되었습니다');
    router.push('/mypage');
    router.refresh();
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(180deg, #EAF5EC 0%, #F7FAF6 300px)' }}>
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-foreground">로그인</h1>
          <p className="text-sm text-muted mt-1">교집합에 오신 걸 환영합니다</p>
        </div>

        <button onClick={handleKakao} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mb-4" style={{ background: '#FEE500', color: '#191919' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.58 1 1 3.8 1 7.28c0 2.24 1.49 4.2 3.74 5.32l-.96 3.53a.3.3 0 0 0 .45.33L8.3 13.9c.23.02.46.03.7.03 4.42 0 8-2.8 8-6.28S13.42 1 9 1Z" fill="#191919"/></svg>
          카카오로 로그인
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted">또는</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-[#E3EADF] space-y-4">
          <label className="block">
            <span className="text-xs font-semibold text-foreground">이메일</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" required className="input-field mt-1" />
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-foreground">비밀번호</span>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 입력" required className="input-field mt-1" />
          </label>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#66c477] hover:bg-[#4EA85E] text-white font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center">
            {loading ? <ButtonSpinner /> : '로그인'}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          계정이 없으신가요? <Link href="/signup" className="text-[#4EA85E] font-semibold hover:underline">회원가입</Link>
        </p>
      </div>
    </div>
  );
}
