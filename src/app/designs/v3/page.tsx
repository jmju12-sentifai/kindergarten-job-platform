'use client';

import Link from 'next/link';
import { useState } from 'react';
import { jobPostings } from '@/data/mock';
import Icon from '@/components/Icon';

const categoryTiles = [
  { label: '담임교사', icon: 'user' as const },
  { label: '보조교사', icon: 'users' as const },
  { label: '방과후', icon: 'clock' as const },
  { label: '원감', icon: 'star' as const },
  { label: '특별활동', icon: 'sparkle' as const },
  { label: '국공립', icon: 'building' as const },
  { label: '사립', icon: 'school' as const },
  { label: '초보가능', icon: 'sprout' as const },
  { label: '방학있음', icon: 'palm' as const },
  { label: '식사제공', icon: 'bowl' as const },
];

const banners = [
  { tag: '신규오픈', title: '교집합에 오신 걸 환영해요', sub: '지금 가입하면 이력서 추천 1회 무료', bg: '#66c477' },
  { tag: '이번 주 HOT', title: '서울·경기 담임교사 모집 집중', sub: '마감 임박 12건 · 지금 확인하세요', bg: '#4EA85E' },
  { tag: 'TIP', title: '합격률 높이는 이력서 작성법', sub: '유치원장이 직접 알려주는 3가지', bg: '#A5D6A7' },
];

export default function V3() {
  const [bannerIdx, setBannerIdx] = useState(0);
  const newJobs = [...jobPostings].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()).slice(0, 8);
  const deadlineJobs = [...jobPostings]
    .filter((j) => new Date(j.deadline).getTime() > Date.now())
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 8);
  const popularJobs = [...jobPostings].sort((a, b) => b.applicantCount - a.applicantCount).slice(0, 8);

  return (
    <div className="bg-[#F7FAF6] min-h-screen">
      {/* Top search + banner row */}
      <section className="bg-white border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-5">
          <form className="flex gap-2 mb-5">
            <select className="h-10 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-[#66c477]">
              <option>전체지역</option>
              <option>서울</option><option>경기</option><option>인천</option>
            </select>
            <select className="h-10 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-[#66c477]">
              <option>전체직종</option>
              <option>담임교사</option><option>보조교사</option><option>방과후교사</option>
            </select>
            <input
              type="text"
              placeholder="유치원명, 키워드 검색"
              className="flex-1 h-10 px-4 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-[#66c477]"
            />
            <button className="h-10 px-6 bg-[#4EA85E] text-white text-sm font-semibold rounded-md hover:bg-[#3d8b4c]">검색</button>
          </form>

          {/* Banner carousel (static 3-swatch) */}
          <div className="grid grid-cols-3 gap-3">
            {banners.map((b, i) => (
              <button
                key={b.title}
                onClick={() => setBannerIdx(i)}
                className={`relative text-left rounded-xl p-4 text-white overflow-hidden transition-all ${bannerIdx === i ? 'ring-2 ring-offset-2 ring-[#66c477]' : ''}`}
                style={{ backgroundColor: b.bg }}
              >
                <span className="text-[10px] font-bold bg-white/25 px-2 py-0.5 rounded-full">{b.tag}</span>
                <p className="text-sm font-bold mt-2 leading-snug">{b.title}</p>
                <p className="text-[11px] opacity-90 mt-0.5">{b.sub}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category tiles */}
      <section className="max-w-[1200px] mx-auto px-4 py-6">
        <h2 className="text-sm font-bold text-foreground mb-3">카테고리별 탐색</h2>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2 bg-white border border-border rounded-xl p-3">
          {categoryTiles.map((c) => (
            <Link
              key={c.label}
              href={`/jobs?q=${encodeURIComponent(c.label)}`}
              className="flex flex-col items-center gap-1.5 py-3 rounded-lg hover:bg-[#EAF5EC] transition-colors text-foreground/70 hover:text-[#4EA85E]"
            >
              <Icon name={c.icon} size={22} stroke={1.8} />
              <span className="text-[11px] font-semibold">{c.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Horizontal scroll sections */}
      <HScrollSection title="지원자 많은 공고" titleIcon="flame" subtitle="이번 주 가장 많이 담긴 공고" jobs={popularJobs} />
      <HScrollSection title="마감 임박" titleIcon="clock" subtitle="지금 지원하지 않으면 놓쳐요" jobs={deadlineJobs} danger />
      <HScrollSection title="신규 공고" titleIcon="sparkle" subtitle="방금 올라온 따끈한 공고" jobs={newJobs} />

      {/* Bottom dual CTA */}
      <section className="max-w-[1200px] mx-auto px-4 pb-16">
        <div className="bg-white border border-border rounded-xl grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#EAF5EC] flex items-center justify-center text-[#4EA85E]">
              <Icon name="pencil" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">이력서를 등록하면</p>
              <p className="text-xs text-muted mt-0.5">여러 유치원에서 먼저 연락이 와요.</p>
            </div>
            <Link href="/talents" className="px-4 py-2 text-xs font-semibold bg-[#4EA85E] text-white rounded-md hover:bg-[#3d8b4c]">
              등록
            </Link>
          </div>
          <div className="p-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#A5D6A7]/40 flex items-center justify-center text-[#4EA85E]">
              <Icon name="megaphone" size={24} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">공고를 등록하면</p>
              <p className="text-xs text-muted mt-0.5">지역 기반 매칭으로 빠르게 채용돼요.</p>
            </div>
            <Link href="/jobs/new" className="px-4 py-2 text-xs font-semibold text-[#4EA85E] border border-[#4EA85E] rounded-md hover:bg-[#EAF5EC]">
              등록
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function HScrollSection({
  title,
  titleIcon,
  subtitle,
  jobs,
  danger,
}: {
  title: string;
  titleIcon: 'flame' | 'clock' | 'sparkle';
  subtitle: string;
  jobs: typeof jobPostings;
  danger?: boolean;
}) {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-4">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-1.5">
            <Icon name={titleIcon} size={18} className="text-[#4EA85E]" />
            {title}
          </h2>
          <p className="text-xs text-muted mt-0.5">{subtitle}</p>
        </div>
        <Link href="/jobs" className="text-xs font-semibold text-[#4EA85E] hover:underline">전체보기 →</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
        {jobs.map((job) => {
          const d = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
          return (
            <Link
              key={job.id}
              href={`/jobs/${job.id}`}
              className="flex-shrink-0 w-[240px] bg-white border border-border rounded-xl p-4 hover:border-[#66c477] hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-[#EAF5EC] text-[#4EA85E] flex items-center justify-center text-[11px] font-bold">
                  {job.kindergarten.name.slice(0, 2)}
                </div>
                <span className={`text-[11px] font-bold ${danger ? 'text-[#E86830]' : d > 7 ? 'text-[#4EA85E]' : 'text-[#E86830]'}`}>
                  {d > 0 ? `D-${d}` : '마감'}
                </span>
              </div>
              <p className="text-[11px] text-muted mb-0.5 truncate">{job.kindergarten.name} · {job.kindergarten.addressShort}</p>
              <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-2 min-h-[34px]">{job.title}</h3>
              <div className="flex flex-wrap gap-1 mt-2.5">
                <span className="text-[10px] px-1.5 py-0.5 bg-[#EAF5EC] text-[#4EA85E] rounded">{job.position}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-[#F7FAF6] text-foreground/60 border border-border rounded">{job.employmentType}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
