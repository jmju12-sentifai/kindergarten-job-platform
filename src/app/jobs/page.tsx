'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';
import Spinner, { PageSpinner } from '@/components/Spinner';
import type { PostingWithPositions } from '@/types/database';
import { POSITIONS, POSITION_COLORS, type PositionType } from '@/constants/positions';
import { REGION_LIST, REGIONS } from '@/constants/regions';

const PAGE_SIZE = 30;

function getDaysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

// 카드 표시/필터에 필요한 컬럼만 선택 — 페이로드 다이어트
const POSTING_CARD_COLUMNS =
  'id, institution_id, title, deadline, commute_areas, archived_at, created_at, updated_at, ' +
  'position_entries(id, position), ' +
  'institution_profiles(id, name, address, address_short)';

function JobsContent() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') || '';
  const initialRegion = searchParams.get('region') || '';
  const initialSub = searchParams.get('sub') || '';
  const initialPosition = searchParams.get('position') || '';

  const [postings, setPostings] = useState<PostingWithPositions[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const [searchQuery, setSearchQuery] = useState(initialQ);
  // 검색어는 디바운스해서 DB 호출 트리거
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [region, setRegion] = useState(initialRegion);
  const [subRegion, setSubRegion] = useState(initialSub);
  const [position, setPosition] = useState(initialPosition);
  const [sort, setSort] = useState<'latest' | 'deadline'>('latest');

  // race condition 방지: 가장 최근 요청만 반영
  const reqIdRef = useRef(0);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchPage = useCallback(
    async (offset: number, append: boolean) => {
      const supabase = createClient();
      const myReq = ++reqIdRef.current;
      const { data, error } = await supabase
        .rpc('search_active_postings', {
          p_search: debouncedQuery || null,
          p_region: region || null,
          p_sub_region: subRegion || null,
          p_position: position || null,
          p_sort: sort,
          p_limit: PAGE_SIZE,
          p_offset: offset,
        })
        .select(POSTING_CARD_COLUMNS);
      // 더 새로운 요청이 이미 떴으면 결과 무시
      if (myReq !== reqIdRef.current) return;
      if (error) {
        // 정책상 에러는 조용히 빈 결과로 — 콘솔에만 남김
        console.error('search_active_postings failed', error);
        if (!append) setPostings([]);
        setHasMore(false);
        return;
      }
      const today = new Date().toISOString().split('T')[0];
      const rows = (((data ?? []) as unknown) as PostingWithPositions[])
        .filter((p) => p.deadline >= today);
      setHasMore(rows.length === PAGE_SIZE);
      setPostings((prev) => (append ? [...prev, ...rows] : rows));
    },
    [debouncedQuery, region, subRegion, position, sort]
  );

  // 필터 변경 시 첫 페이지부터 재조회
  useEffect(() => {
    let cancelled = false;
    if (initialLoading) {
      fetchPage(0, false).finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    } else {
      setRefreshing(true);
      fetchPage(0, false).finally(() => {
        if (!cancelled) setRefreshing(false);
      });
    }
    return () => {
      cancelled = true;
    };
    // initialLoading 은 한 번만 영향 → deps 에서 제외해 무한 루프 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchPage]);

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await fetchPage(postings.length, true);
    setLoadingMore(false);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRegion('');
    setSubRegion('');
    setPosition('');
  };

  const hasFilters = !!(searchQuery || region || subRegion || position);

  if (initialLoading) {
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
          현재 <span className="font-semibold text-foreground">{postings.length}</span>건
          {hasMore && <span className="text-muted/70"> +</span>}
          {refreshing && (
            <span className="ml-2 inline-flex items-center align-middle"><Spinner size={12} className="text-muted/70" /></span>
          )}
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
        {postings.map((posting) => {
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

      {postings.length === 0 && !refreshing && (
        <div className="text-center py-16">
          <p className="text-sm text-muted mb-2">검색 결과가 없습니다.</p>
          {hasFilters && (
            <button onClick={clearFilters} className="text-xs text-primary-dark hover:underline">
              필터 초기화
            </button>
          )}
        </div>
      )}

      {hasMore && postings.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#C5D4CA] bg-white text-sm text-foreground hover:bg-[#EAF5EC] hover:border-[#A5D6A7] disabled:opacity-60"
          >
            {loadingMore ? <Spinner size={14} className="text-muted" /> : null}
            더 보기
          </button>
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
