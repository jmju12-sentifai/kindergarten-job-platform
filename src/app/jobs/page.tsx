'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';
import { PageSpinner } from '@/components/Spinner';
import type { PostingWithPositions, PositionType } from '@/types/database';

const REGIONS = ['서울', '경기', '인천', '부산', '대구', '대전', '광주'];
const POSITIONS: PositionType[] = ['원감', '담임교사', '보조교사', '방과후교사', '특별활동강사'];

function getDaysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function JobsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialRegion = searchParams.get('region') || '';
  const initialPosition = searchParams.get('position') || '';

  const [postings, setPostings] = useState<PostingWithPositions[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [region, setRegion] = useState(initialRegion);
  const [position, setPosition] = useState(initialPosition);
  const [sort, setSort] = useState<'latest' | 'deadline'>('latest');

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      // 마감일 + 1개월이 지난 공고 미노출
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      const { data } = await supabase
        .from('postings')
        .select('*, position_entries(*), institution_profiles!inner(*)')
        .gte('deadline', oneMonthAgo.toISOString().split('T')[0])
        .order('created_at', { ascending: false });
      setPostings((data as PostingWithPositions[] | null) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let list = [...postings];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.institution_profiles.name.toLowerCase().includes(q) ||
          p.institution_profiles.address.toLowerCase().includes(q)
      );
    }

    if (region) {
      list = list.filter((p) => p.institution_profiles.address_short.includes(region));
    }

    if (position) {
      list = list.filter((p) =>
        p.position_entries.some((pe) => pe.position === position)
      );
    }

    if (sort === 'deadline') {
      list.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [postings, searchQuery, region, position, sort]);

  const clearFilters = () => {
    setSearchQuery('');
    setRegion('');
    setPosition('');
  };

  const hasFilters = searchQuery || region || position;

  if (loading) {
    return <PageSpinner />;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <h1 className="text-lg font-bold text-foreground mb-4">채용공고</h1>

      {/* Search */}
      <div className="relative mb-4">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text"
          placeholder="유치원, 지역, 키워드 검색"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field" style={{ paddingLeft: 36 }}
        />
      </div>

      {/* Position filter tabs */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={() => setPosition('')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            !position
              ? 'bg-primary-dark text-white border-primary-dark'
              : 'bg-white text-foreground/70 border-border hover:border-primary'
          }`}
        >
          전체
        </button>
        {POSITIONS.map((pos) => (
          <button
            key={pos}
            onClick={() => setPosition(position === pos ? '' : pos)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              position === pos
                ? 'bg-primary-dark text-white border-primary-dark'
                : 'bg-white text-foreground/70 border-border hover:border-primary'
            }`}
          >
            {pos}
          </button>
        ))}
      </div>

      {/* Region chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(region === r ? '' : r)}
            className={`px-2.5 py-1 text-[11px] rounded-md border transition-colors ${
              region === r
                ? 'bg-secondary text-primary-dark border-primary font-semibold'
                : 'bg-white text-muted border-border hover:border-primary/50'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-muted">
          총 <span className="font-semibold text-foreground">{filtered.length}</span>건
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as 'latest' | 'deadline')}
          className="h-8 px-2 bg-white border border-border rounded text-xs focus:outline-none focus:border-primary"
        >
          <option value="latest">최신순</option>
          <option value="deadline">마감임박순</option>
        </select>
      </div>

      {/* Job cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((posting) => {
          const daysLeft = getDaysLeft(posting.deadline);
          const inst = posting.institution_profiles;
          const positions = posting.position_entries.map((pe) => pe.position);
          const uniquePositions = [...new Set(positions)];

          return (
            <Link key={posting.id} href={`/jobs/${posting.id}`} className="block">
              <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm hover:border-primary/50 transition-all duration-150">
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1">
                    {posting.title}
                  </h3>
                  <span
                    className={`text-xs font-bold flex-shrink-0 ${
                      daysLeft > 7
                        ? 'text-primary-dark'
                        : daysLeft > 0
                        ? 'text-badge-dday'
                        : 'text-muted line-through'
                    }`}
                  >
                    {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
                  </span>
                </div>

                <p className="text-xs text-muted mb-2">
                  {inst.name} · {inst.address_short}
                </p>

                <div className="flex flex-wrap gap-1">
                  {uniquePositions.map((pos) => (
                    <span
                      key={pos}
                      className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground/60 rounded"
                    >
                      {pos}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-sm text-muted mb-2">검색 결과가 없습니다.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-primary-dark hover:underline">
              필터 초기화
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={<PageSpinner />}
    >
      <JobsContent />
    </Suspense>
  );
}
