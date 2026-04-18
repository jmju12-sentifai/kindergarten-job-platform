'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { jobPostings } from '@/data/mock';

const regions = ['전국', '서울', '경기', '인천', '부산', '대구', '대전', '광주', '세종', '울산'];
const positions = ['전체', '담임교사', '보조교사', '방과후교사', '원감', '특별활동강사'];
const employmentTypes = ['전체', '정규직', '기간제', '시간제'];

export default function V1() {
  const [region, setRegion] = useState('전국');
  const [position, setPosition] = useState('전체');
  const [empType, setEmpType] = useState('전체');
  const [tab, setTab] = useState<'new' | 'deadline' | 'popular'>('new');

  const jobs = useMemo(() => {
    let list = [...jobPostings];
    if (position !== '전체') list = list.filter((j) => j.position === position);
    if (empType !== '전체') list = list.filter((j) => j.employmentType === empType);
    if (region !== '전국') list = list.filter((j) => j.kindergarten.addressShort.includes(region));
    if (tab === 'deadline') {
      list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else if (tab === 'popular') {
      list.sort((a, b) => b.applicantCount - a.applicantCount);
    } else {
      list.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime());
    }
    return list;
  }, [region, position, empType, tab]);

  return (
    <div className="bg-[#F7FAF6] min-h-screen">
      {/* Top banner */}
      <section className="bg-white border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6">
          <div>
            <p className="text-xs font-semibold text-[#4EA85E] mb-2">교집합 · 유치원 교사 채용</p>
            <h1 className="text-[26px] md:text-[30px] font-bold text-foreground leading-tight tracking-tight">
              선생님과 유치원이 만나는 곳,<br />
              <span className="text-[#4EA85E]">교집합</span>에서 시작하세요.
            </h1>
            <p className="text-sm text-muted mt-3">전국 유치원 채용 공고 · 간편 지원 · 이력서 한 번 등록</p>
          </div>
          <div className="flex gap-2 md:flex-col md:items-stretch md:min-w-[180px]">
            <Link href="/jobs/new" className="flex-1 md:flex-none text-center px-4 py-2.5 text-sm font-semibold border border-[#4EA85E] text-[#4EA85E] rounded-md hover:bg-[#EAF5EC]">
              공고 등록
            </Link>
            <Link href="/talents" className="flex-1 md:flex-none text-center px-4 py-2.5 text-sm font-semibold bg-[#4EA85E] text-white rounded-md hover:bg-[#3d8b4c]">
              이력서 등록
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="max-w-[1200px] mx-auto px-4 pb-6">
          <form className="flex gap-2">
            <select className="h-11 px-3 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-[#66c477]">
              <option>전체지역</option>
              {regions.slice(1).map((r) => <option key={r}>{r}</option>)}
            </select>
            <input
              type="text"
              placeholder="유치원명, 지역, 직무 키워드로 검색"
              className="flex-1 h-11 px-4 bg-white border border-border rounded-md text-sm focus:outline-none focus:border-[#66c477]"
            />
            <button type="submit" className="h-11 px-6 bg-[#4EA85E] text-white text-sm font-semibold rounded-md hover:bg-[#3d8b4c]">
              검색
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted">인기 검색어</span>
            {['강남', '정규직', '방학있음', '국공립', '담임교사', '초보가능'].map((k) => (
              <button key={k} className="text-xs px-2 py-1 bg-[#EAF5EC] text-[#4EA85E] rounded-full hover:bg-[#A5D6A7]/40">
                #{k}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-b border-border">
        <div className="max-w-[1200px] mx-auto px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          {[
            { label: '등록 유치원', value: '128' },
            { label: '등록 교사', value: '214' },
            { label: '진행중 공고', value: '37' },
            { label: '오늘 신규', value: '8' },
          ].map((s) => (
            <div key={s.label} className="flex items-center justify-center gap-2">
              <span className="text-base font-bold text-[#4EA85E]">{s.value}</span>
              <span className="text-xs text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
        {/* Left filter sidebar */}
        <aside className="space-y-4">
          <FilterBox title="지역" items={regions} value={region} onChange={setRegion} />
          <FilterBox title="직종" items={positions} value={position} onChange={setPosition} />
          <FilterBox title="고용형태" items={employmentTypes} value={empType} onChange={setEmpType} />
        </aside>

        {/* Right content */}
        <div>
          <div className="flex items-end justify-between border-b border-border mb-0">
            <div className="flex">
              {([
                ['new', '신규 공고'],
                ['deadline', '마감 임박'],
                ['popular', '지원자 많은 순'],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === k ? 'text-[#4EA85E] border-[#4EA85E]' : 'text-muted border-transparent hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted pb-2">총 {jobs.length}건</span>
          </div>

          {/* Job list (dense rows) */}
          <div className="bg-white border border-border border-t-0 rounded-b-md divide-y divide-border">
            {jobs.slice(0, 10).map((job) => {
              const d = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="flex items-center gap-4 px-4 py-3.5 hover:bg-[#F7FAF6] transition-colors"
                >
                  <div className="w-10 h-10 rounded-md bg-[#EAF5EC] text-[#4EA85E] flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {job.kindergarten.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted">{job.kindergarten.name}</span>
                      <span className="text-[10px] text-muted">·</span>
                      <span className="text-xs text-muted">{job.kindergarten.addressShort}</span>
                    </div>
                    <h3 className="text-sm font-semibold text-foreground truncate">{job.title}</h3>
                  </div>
                  <div className="hidden sm:flex flex-wrap gap-1 max-w-[260px] justify-end">
                    <Tag>{job.position}</Tag>
                    <Tag>{job.employmentType}</Tag>
                    {job.mealProvided && <Tag>식사제공</Tag>}
                  </div>
                  <div className="w-16 text-right flex-shrink-0">
                    <span className={`text-xs font-bold ${d > 7 ? 'text-[#4EA85E]' : d > 0 ? 'text-[#E86830]' : 'text-muted line-through'}`}>
                      {d > 0 ? `D-${d}` : '마감'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="text-center mt-5">
            <Link href="/jobs" className="inline-block px-5 py-2 text-sm font-semibold text-[#4EA85E] border border-[#4EA85E] rounded-md hover:bg-[#EAF5EC]">
              전체 채용공고 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBox({ title, items, value, onChange }: { title: string; items: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="bg-white border border-border rounded-md">
      <div className="px-3 py-2 border-b border-border text-xs font-bold text-foreground">{title}</div>
      <div className="p-1.5">
        {items.map((it) => (
          <button
            key={it}
            onClick={() => onChange(it)}
            className={`w-full text-left px-2.5 py-1.5 text-xs rounded transition-colors ${
              value === it ? 'bg-[#EAF5EC] text-[#4EA85E] font-semibold' : 'text-foreground/70 hover:bg-[#F7FAF6]'
            }`}
          >
            {it}
          </button>
        ))}
      </div>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return <span className="text-[11px] px-1.5 py-0.5 bg-[#F7FAF6] text-foreground/60 border border-border rounded">{children}</span>;
}
