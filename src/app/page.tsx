'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import Spinner from '@/components/Spinner';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { PostingWithPositions } from '@/types/database';

const positionChips = [
  { label: '담임교사', icon: 'user' as const },
  { label: '보조교사', icon: 'users' as const },
  { label: '방과후교사', icon: 'clock' as const },
  { label: '원감', icon: 'star' as const },
  { label: '특별활동', icon: 'sparkle' as const },
  { label: '무관', icon: 'check' as const },
];
const regionChips = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '세종'];

export default function Home() {
  const [tab, setTab] = useState('전체');
  const [postings, setPostings] = useState<PostingWithPositions[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();
  const supabase = createClient();
  const userType = profile?.user_type;

  useEffect(() => {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    supabase
      .from('postings')
      .select('*, position_entries(*), institution_profiles(*)')
      .gte('deadline', oneMonthAgo.toISOString().split('T')[0])
      .order('created_at', { ascending: false })
      .limit(6)
      .then(({ data }: { data: PostingWithPositions[] | null }) => {
        if (data) setPostings(data);
        setLoading(false);
      });
  }, []);

  const filteredPostings = tab === '전체'
    ? postings
    : postings.filter((p) => p.position_entries.some((pe) => pe.position === tab));

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #EAF5EC 0%, #F7FAF6 260px)' }}>
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 pt-6 sm:pt-10 pb-6">
        <div className="bg-white rounded-2xl md:rounded-3xl grid md:grid-cols-[1fr_410px] items-stretch gap-0 overflow-hidden shadow-[0_6px_24px_rgba(102,196,119,0.12)]">
          <div className="p-4 sm:p-5 md:pl-10 md:py-12 md:pr-4">
            <div className="inline-flex items-center gap-1.5 bg-[#EAF5EC] text-[#4EA85E] px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-3">
              <Icon name="leaf" size={14} />
              선생님과 유치원을 잇는 따뜻한 연결
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground leading-snug">
              오늘도 아이들과 만날
              <br />
              <span className="text-[#4EA85E]">우리 선생님</span>을 찾고 있어요
            </h1>
            <p className="text-xs sm:text-sm text-muted mt-2 sm:mt-3">전국 유치원 채용부터 간편 지원까지, 교집합 하나면 충분해요.</p>
            <form className="mt-4 sm:mt-5 flex items-center bg-[#F7FAF6] border-2 border-[#A5D6A7] rounded-full pl-3 sm:pl-5 pr-1 sm:pr-1.5 py-1 sm:py-1.5 w-full max-w-[520px]" action="/jobs">
              <Icon name="search" size={16} className="text-[#4EA85E] mr-1.5 sm:mr-2 flex-shrink-0" />
              <input name="q" type="text" placeholder="유치원, 지역, 키워드" className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm focus:outline-none placeholder:text-muted" />
              <button className="bg-[#66c477] hover:bg-[#4EA85E] text-white text-xs sm:text-sm font-semibold px-3 sm:px-5 py-1.5 sm:py-2 rounded-full flex-shrink-0">검색</button>
            </form>
          </div>
          <div className="relative hidden md:block min-h-[320px]">
            <Image src="/kids.png" alt="아이의 손을 잡아주는 선생님" fill priority sizes="410px" className="object-contain object-top" />
          </div>
        </div>
      </section>

      {/* CTA banners — 유저 타입에 따라 본인 것만 표시, 비로그인은 둘 다 */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4">
        <div className={`grid gap-3 ${userType ? '' : 'md:grid-cols-2'}`}>
          {userType !== 'institution' && (
            <div className="relative rounded-2xl bg-[#A5D6A7]/40 p-5 overflow-hidden">
              <p className="text-xs font-semibold text-[#4EA85E] mb-1">선생님이시라면</p>
              <h3 className="text-lg font-bold text-foreground leading-snug">이력서 한 번에,<br />여러 유치원에서 연락이 와요</h3>
              <Link href="/resume/edit" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold bg-white text-[#4EA85E] px-3.5 py-1.5 rounded-full hover:bg-[#EAF5EC]">이력서 등록하기 <span aria-hidden>→</span></Link>
              <div className="absolute -right-3 -bottom-3 text-[#4EA85E]/25"><Icon name="mail" size={110} stroke={1.4} /></div>
            </div>
          )}
          {userType !== 'teacher' && (
            <div className="relative rounded-2xl bg-[#a7dba7]/50 p-5 overflow-hidden">
              <p className="text-xs font-semibold text-[#4EA85E] mb-1">원장님이시라면</p>
              <h3 className="text-lg font-bold text-foreground leading-snug">딱 맞는 선생님,<br />교집합이 골라드려요</h3>
              <Link href="/jobs/new" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold bg-white text-[#4EA85E] px-3.5 py-1.5 rounded-full hover:bg-[#EAF5EC]">공고 등록하기 <span aria-hidden>→</span></Link>
              <div className="absolute -right-3 -bottom-3 text-[#4EA85E]/25"><Icon name="target" size={110} stroke={1.4} /></div>
            </div>
          )}
        </div>
      </section>

      {/* Position chips */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4">
        <p className="text-sm font-bold text-foreground mb-3">어떤 자리 찾고 있어요?</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {positionChips.map((p) => {
            const active = tab === p.label || (p.label === '무관' && tab === '전체');
            return (
              <button key={p.label} onClick={() => setTab(p.label === '무관' ? '전체' : p.label)}
                className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${active ? 'bg-[#EAF5EC] border-[#66c477] text-[#4EA85E]' : 'bg-white border-transparent text-foreground/70 hover:border-[#A5D6A7]'}`}>
                <Icon name={p.icon} size={24} stroke={1.8} />
                <span className="text-xs font-semibold">{p.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Region chips */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {regionChips.map((r, i) => (
            <Link key={r} href={`/jobs?region=${encodeURIComponent(r)}`}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-[#E3EADF] hover:bg-[#EAF5EC] hover:border-[#A5D6A7]"
              style={i === 0 ? { background: '#a7dba7', color: '#1F2B1F', borderColor: '#a7dba7' } : {}}>
              {r}
            </Link>
          ))}
        </div>
      </section>

      {/* Job cards */}
      <section className="max-w-[1200px] mx-auto px-3 sm:px-4 py-6 pb-16">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs text-[#4EA85E] font-semibold mb-0.5">추천 공고</p>
            <h2 className="text-lg font-bold text-foreground">따끈따끈한 새 공고</h2>
          </div>
          <Link href="/jobs" className="text-xs font-semibold text-[#4EA85E] hover:underline">전체보기 →</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} className="text-[#66c477]" />
          </div>
        ) : filteredPostings.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPostings.map((posting) => {
              const d = Math.max(0, Math.ceil((new Date(posting.deadline).getTime() - Date.now()) / 86400000));
              const inst = posting.institution_profiles;
              return (
                <Link key={posting.id} href={`/jobs/${posting.id}`}
                  className="bg-white rounded-2xl p-5 border border-[#E3EADF] hover:border-[#A5D6A7] hover:shadow-[0_8px_24px_rgba(102,196,119,0.15)] transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-9 h-9 rounded-full bg-[#EAF5EC] flex items-center justify-center text-[#4EA85E]"><Icon name="home" size={18} /></div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted truncate">{inst?.name}</p>
                      <p className="text-[11px] text-muted">{inst?.address_short}</p>
                    </div>
                    <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${d > 7 ? 'bg-[#EAF5EC] text-[#4EA85E]' : d > 0 ? 'bg-orange-50 text-[#E86830]' : 'bg-gray-100 text-muted'}`}>
                      {d > 0 ? `D-${d}` : '마감'}
                    </span>
                  </div>
                  <h3 className="text-[15px] font-bold text-foreground mb-2 leading-snug line-clamp-2">{posting.title}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {posting.position_entries.map((pe) => (
                      <span key={pe.id} className="text-[11px] px-2 py-0.5 bg-[#EAF5EC] text-[#4EA85E] rounded-full font-semibold">{pe.position}</span>
                    ))}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E3EADF]">
            <Icon name="search" size={40} className="text-muted mx-auto mb-3" />
            <p className="text-sm text-muted">아직 등록된 공고가 없습니다.</p>
            <Link href="/jobs/new" className="inline-block mt-3 text-xs font-semibold text-[#4EA85E] hover:underline">첫 공고 등록하기 →</Link>
          </div>
        )}
      </section>
    </div>
  );
}
