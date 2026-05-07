'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';
import { PageSpinner } from '@/components/Spinner';
import type { PostingWithPositions } from '@/types/database';
import { POSITIONS, POSITION_COLORS, type PositionType } from '@/constants/positions';
import { REGION_LIST, REGIONS } from '@/constants/regions';

function getDaysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

function JobsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialRegion = searchParams.get('region') || '';
  const initialSub = searchParams.get('sub') || '';
  const initialPosition = searchParams.get('position') || '';

  const [postings, setPostings] = useState<PostingWithPositions[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialQ);
  const [region, setRegion] = useState(initialRegion);
  const [subRegion, setSubRegion] = useState(initialSub);
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
        .is('archived_at', null)
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
      list = list.filter((p) => {
        const addr = p.institution_profiles.address || '';
        const commutes = (p.commute_areas || []) as string[];
        const matchRegion = addr.includes(region)
          || commutes.some((c) => c.includes(region));
        if (!matchRegion) return false;
        if (subRegion) {
          const matchSub = addr.includes(subRegion)
            || commutes.some((c) => c.includes(subRegion));
          if (!matchSub) return false;
        }
        return true;
      });
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
  }, [postings, searchQuery, region, subRegion, position, sort]);

  const clearFilters = () => {
    setSearchQuery('');
    setRegion('');
    setSubRegion('');
    setPosition('');
  };

  const hasFilters = searchQuery || region || subRegion || position;

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
        {POSITIONS.map((pos) => {
          const active = position === pos;
          const colors = POSITION_COLORS[pos];
          return (
            <button
              key={pos}
              onClick={() => setPosition(active ? '' : pos)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
                active
                  ? `${colors.bg} ${colors.text} border-current font-semibold`
                  : 'bg-white text-foreground/70 border-border hover:border-primary'
              }`}
            >
              {pos}
            </button>
          );
        })}
      </div>

      {/* Region chips — 메인과 동일한 스타일 */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
        {REGION_LIST.map((r) => {
          const hasSubregions = REGIONS[r] && REGIONS[r].length > 0;
          const active = region === r;
          return (
            <button
              key={r}
              type="button"
              onClick={() => {
                if (active) { setRegion(''); setSubRegion(''); }
                else { setRegion(r); setSubRegion(''); }
              }}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                active
                  ? 'bg-[#a7dba7] text-foreground border-[#a7dba7]'
                  : 'bg-white text-foreground border-[#C5D4CA] hover:bg-[#EAF5EC] hover:border-[#A5D6A7]'
              }`}
            >
              {r}{hasSubregions ? ' ▾' : ''}
            </button>
          );
        })}
      </div>
      {region && REGIONS[region] && REGIONS[region].length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4">
          {REGIONS[region].map((sub) => {
            const active = subRegion === sub;
            return (
              <button
                key={sub}
                type="button"
                onClick={() => setSubRegion(active ? '' : sub)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-[#a7dba7] text-foreground border-[#a7dba7]'
                    : 'bg-white text-foreground border-[#C5D4CA] hover:bg-[#EAF5EC] hover:border-[#A5D6A7]'
                }`}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}

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
              <div className="bg-card border-2 border-[#B5CFB9] rounded-lg p-4 hover:shadow-sm hover:border-primary/50 transition-all duration-150">
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

                <p className="text-xs text-muted mb-1">
                  {inst.name} · {inst.address_short}
                </p>

                {posting.commute_areas && posting.commute_areas.length > 0 && (
                  <p className="text-[11px] text-muted/70 mb-2">
                    출퇴근 가능지역 {posting.commute_areas.slice(0, 3).join(', ')}
                    {posting.commute_areas.length > 3 && ` 외 ${posting.commute_areas.length - 3}`}
                  </p>
                )}

                <div className="flex flex-wrap gap-1">
                  {uniquePositions.map((pos) => {
                    const colors = POSITION_COLORS[pos as PositionType];
                    return (
                      <span
                        key={pos}
                        className={`text-[11px] px-1.5 py-0.5 rounded ${colors?.bg ?? 'bg-secondary'} ${colors?.text ?? 'text-foreground/60'}`}
                      >
                        {pos}
                      </span>
                    );
                  })}
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
