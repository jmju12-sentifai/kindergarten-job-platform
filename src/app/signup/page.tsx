'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Icon from '@/components/Icon';
import { PageSpinner } from '@/components/Spinner';

function SignupSplitContent() {
  const searchParams = useSearchParams();
  const kakaoSuffix = searchParams.get('kakao') === '1' ? '?kakao=1' : '';
  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-12" style={{ background: 'linear-gradient(180deg, #EAF5EC 0%, #F7FAF6 300px)' }}>
      <div className="w-full max-w-[720px]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">교집합 회원가입</h1>
          <p className="text-sm text-muted mt-1">가입 유형을 선택해주세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 구직자 (왼쪽) */}
          <Link href={`/signup/teacher${kakaoSuffix}`} className="group bg-white rounded-2xl p-8 border-2 border-[#E3EADF] hover:border-[#66c477] hover:shadow-[0_8px_24px_rgba(102,196,119,0.15)] transition-all text-center">
            <div className="w-16 h-16 rounded-full bg-[#EAF5EC] flex items-center justify-center text-[#4EA85E] mx-auto mb-4">
              <Icon name="user" size={32} stroke={1.6} />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">구직자</h2>
            <p className="text-sm text-muted mb-4">유치원 교사직을 찾고 있어요</p>
            <ul className="text-xs text-muted text-left space-y-1.5">
              <li className="flex items-center gap-2"><Icon name="check" size={14} className="text-[#4EA85E]" /> 이력서 등록 및 관리</li>
              <li className="flex items-center gap-2"><Icon name="check" size={14} className="text-[#4EA85E]" /> 공고 검색 및 지원</li>
              <li className="flex items-center gap-2"><Icon name="check" size={14} className="text-[#4EA85E]" /> 지원 현황 확인</li>
            </ul>
            <div className="mt-5 px-4 py-2.5 bg-[#66c477] text-white text-sm font-semibold rounded-full group-hover:bg-[#4EA85E] transition-colors">
              구직자로 가입하기
            </div>
          </Link>

          {/* 구인자 (오른쪽) */}
          <Link href={`/signup/institution${kakaoSuffix}`} className="group bg-white rounded-2xl p-8 border-2 border-[#E3EADF] hover:border-[#66c477] hover:shadow-[0_8px_24px_rgba(102,196,119,0.15)] transition-all text-center">
            <div className="w-16 h-16 rounded-full bg-[#EAF5EC] flex items-center justify-center text-[#4EA85E] mx-auto mb-4">
              <Icon name="building" size={32} stroke={1.6} />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-1">구인자 (기관)</h2>
            <p className="text-sm text-muted mb-4">교사를 채용하고 싶어요</p>
            <ul className="text-xs text-muted text-left space-y-1.5">
              <li className="flex items-center gap-2"><Icon name="check" size={14} className="text-[#4EA85E]" /> 공고 등록 및 관리</li>
              <li className="flex items-center gap-2"><Icon name="check" size={14} className="text-[#4EA85E]" /> 지원자 이력서 열람</li>
              <li className="flex items-center gap-2"><Icon name="check" size={14} className="text-[#4EA85E]" /> 채용 상태 관리</li>
            </ul>
            <div className="mt-5 px-4 py-2.5 border-2 border-[#66c477] text-[#4EA85E] text-sm font-semibold rounded-full group-hover:bg-[#EAF5EC] transition-colors">
              기관으로 가입하기
            </div>
          </Link>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-[#4EA85E] font-semibold hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupSplit() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <SignupSplitContent />
    </Suspense>
  );
}
