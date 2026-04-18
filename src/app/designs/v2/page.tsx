'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { jobPostings } from '@/data/mock';
import Icon from '@/components/Icon';

const positionChips = [
  { label: '담임교사', icon: 'user' as const },
  { label: '보조교사', icon: 'users' as const },
  { label: '방과후교사', icon: 'clock' as const },
  { label: '원감', icon: 'star' as const },
  { label: '특별활동', icon: 'sparkle' as const },
  { label: '무관', icon: 'check' as const },
];
const regionChips = ['서울', '경기', '인천', '부산', '대구', '대전', '광주', '세종'];

export default function V2() {
  const [tab, setTab] = useState('전체');
  const jobs = useMemo(() => {
    if (tab === '전체') return jobPostings;
    return jobPostings.filter((j) => j.position === tab);
  }, [tab]);

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #EAF5EC 0%, #F7FAF6 260px)' }}>
      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-4 pt-10 pb-6">
        <div className="bg-white rounded-3xl grid md:grid-cols-[1fr_410px] items-stretch gap-0 overflow-hidden shadow-[0_6px_24px_rgba(102,196,119,0.12)]">
          <div className="p-6 md:pl-10 md:py-12 md:pr-4">
            <div className="inline-flex items-center gap-1.5 bg-[#EAF5EC] text-[#4EA85E] px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Icon name="leaf" size={14} />
              선생님과 유치원을 잇는 따뜻한 연결
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-snug">
              오늘도 아이들과 만날
              <br />
              <span className="text-[#4EA85E]">우리 선생님</span>을 찾고 있어요
            </h1>
            <p className="text-sm text-muted mt-3">전국 유치원 채용부터 간편 지원까지, 교집합 하나면 충분해요.</p>

            <form className="mt-5 flex items-center bg-[#F7FAF6] border-2 border-[#A5D6A7] rounded-full pl-5 pr-1.5 py-1.5 max-w-[520px]">
              <Icon name="search" size={18} className="text-[#4EA85E] mr-2 flex-shrink-0" />
              <input
                type="text"
                placeholder="어떤 선생님을 찾고 있나요?"
                className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted"
              />
              <button className="bg-[#66c477] hover:bg-[#4EA85E] text-white text-sm font-semibold px-5 py-2 rounded-full">
                찾아보기
              </button>
            </form>
          </div>

          {/* Hero illustration — kids.png full, anchored to top-right */}
          <div className="relative hidden md:block min-h-[320px]">
            <Image
              src="/kids.png"
              alt="아이의 손을 잡아주는 선생님"
              fill
              priority
              sizes="410px"
              className="object-contain object-top"
            />
          </div>
        </div>
      </section>

      {/* Position chips */}
      <section className="max-w-[1200px] mx-auto px-4 py-4">
        <p className="text-sm font-bold text-foreground mb-3">어떤 자리 찾고 있어요?</p>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2.5">
          {positionChips.map((p) => {
            const active = tab === p.label || (p.label === '무관' && tab === '전체');
            return (
              <button
                key={p.label}
                onClick={() => setTab(p.label === '무관' ? '전체' : p.label)}
                className={`flex flex-col items-center justify-center gap-1.5 py-4 rounded-2xl border-2 transition-all ${
                  active ? 'bg-[#EAF5EC] border-[#66c477] text-[#4EA85E]' : 'bg-white border-transparent text-foreground/70 hover:border-[#A5D6A7]'
                }`}
              >
                <Icon name={p.icon} size={24} stroke={1.8} />
                <span className="text-xs font-semibold">{p.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Region chips */}
      <section className="max-w-[1200px] mx-auto px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {regionChips.map((r, i) => (
            <Link
              key={r}
              href={`/jobs?region=${encodeURIComponent(r)}`}
              className="flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold bg-white border border-[#E3EADF] hover:bg-[#EAF5EC] hover:border-[#A5D6A7]"
              style={i === 0 ? { background: '#a7dba7', color: '#1F2B1F', borderColor: '#a7dba7' } : {}}
            >
              {r}
            </Link>
          ))}
        </div>
      </section>

      {/* Dual CTA banner */}
      <section className="max-w-[1200px] mx-auto px-4 py-5">
        <div className="grid md:grid-cols-2 gap-3">
          <div className="relative rounded-2xl bg-[#A5D6A7]/40 p-5 overflow-hidden">
            <p className="text-xs font-semibold text-[#4EA85E] mb-1">선생님이시라면</p>
            <h3 className="text-lg font-bold text-foreground leading-snug">이력서 한 번에,<br />여러 유치원에서 연락이 와요</h3>
            <Link href="/talents" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold bg-white text-[#4EA85E] px-3.5 py-1.5 rounded-full hover:bg-[#EAF5EC]">
              이력서 등록하기
              <span aria-hidden>→</span>
            </Link>
            <div className="absolute -right-3 -bottom-3 text-[#4EA85E]/25">
              <Icon name="mail" size={110} stroke={1.4} />
            </div>
          </div>
          <div className="relative rounded-2xl bg-[#a7dba7]/50 p-5 overflow-hidden">
            <p className="text-xs font-semibold text-[#4EA85E] mb-1">원장님이시라면</p>
            <h3 className="text-lg font-bold text-foreground leading-snug">딱 맞는 선생님,<br />교집합이 골라드려요</h3>
            <Link href="/jobs/new" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold bg-white text-[#4EA85E] px-3.5 py-1.5 rounded-full hover:bg-[#EAF5EC]">
              공고 등록하기
              <span aria-hidden>→</span>
            </Link>
            <div className="absolute -right-3 -bottom-3 text-[#4EA85E]/25">
              <Icon name="target" size={110} stroke={1.4} />
            </div>
          </div>
        </div>
      </section>

      {/* Job cards (soft) */}
      <section className="max-w-[1200px] mx-auto px-4 py-6 pb-16">
        <div className="flex items-end justify-between mb-4">
          <div>
            <p className="text-xs text-[#4EA85E] font-semibold mb-0.5">추천 공고</p>
            <h2 className="text-lg font-bold text-foreground">따끈따끈한 새 공고</h2>
          </div>
          <Link href="/jobs" className="text-xs font-semibold text-[#4EA85E] hover:underline">전체보기 →</Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.slice(0, 6).map((job) => {
            const d = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
            return (
              <Link
                key={job.id}
                href={`/jobs/${job.id}`}
                className="bg-white rounded-2xl p-5 border border-[#E3EADF] hover:border-[#A5D6A7] hover:shadow-[0_8px_24px_rgba(102,196,119,0.15)] transition-all"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-9 h-9 rounded-full bg-[#EAF5EC] flex items-center justify-center text-[#4EA85E]">
                    <Icon name="home" size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted truncate">{job.kindergarten.name}</p>
                    <p className="text-[11px] text-muted">{job.kindergarten.addressShort}</p>
                  </div>
                  <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${d > 7 ? 'bg-[#EAF5EC] text-[#4EA85E]' : d > 0 ? 'bg-orange-50 text-[#E86830]' : 'bg-gray-100 text-muted'}`}>
                    {d > 0 ? `D-${d}` : '마감'}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-foreground mb-2 leading-snug line-clamp-2">{job.title}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 bg-[#EAF5EC] text-[#4EA85E] rounded-full font-semibold">{job.position}</span>
                  <span className="text-[11px] px-2 py-0.5 bg-[#a7dba7]/40 text-[#3d8b4c] rounded-full font-semibold">{job.employmentType}</span>
                  {job.mealProvided && <span className="text-[11px] px-2 py-0.5 bg-[#F7FAF6] text-foreground/70 border border-border rounded-full font-semibold">식사제공</span>}
                  {job.hasVacation && <span className="text-[11px] px-2 py-0.5 bg-[#F7FAF6] text-foreground/70 border border-border rounded-full font-semibold">방학있음</span>}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
