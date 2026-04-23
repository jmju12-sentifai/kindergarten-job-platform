'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { PageSpinner, ButtonSpinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { formatDate, dateToISO } from '@/lib/format';
import type { Posting, PositionEntry } from '@/types/database';
import { POSITIONS, POSITION_COLORS, type PositionType } from '@/constants/positions';

export default function NewJobPage() {
  const router = useRouter();
  const { user, profile, institutionProfile } = useAuth();
  const { toast } = useToast();

  const [existingPostingId, setExistingPostingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  // 마감일: 기본 한달 후, 수정 불가
  const [deadline] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  });
  const [selectedPositions, setSelectedPositions] = useState<PositionType[]>([]);
  const [commuteAreas, setCommuteAreas] = useState<string[]>([]);
  const [areaInput, setAreaInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(true);

  useEffect(() => {
    if (profile && profile.user_type !== 'institution') router.push('/');
  }, [profile, router]);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase
        .from('postings')
        .select('*, position_entries(*)')
        .eq('institution_id', user.id)
        .single();

      if (data) {
        const posting = data as Posting & { position_entries: PositionEntry[]; commute_areas?: string[] };
        setExistingPostingId(posting.id);
        setTitle(posting.title);
        setDescription(posting.description);
        if (posting.commute_areas) setCommuteAreas(posting.commute_areas);
        if (posting.position_entries.length > 0) {
          setSelectedPositions(posting.position_entries.map((pe) => pe.position as PositionType));
        }
      }
      setLoadingExisting(false);
    })();
  }, [user]);

  // 신규 생성 차단 여부 — 기존 공고 없을 때만 체크
  const lockUntil = institutionProfile?.last_posting_locked_until;
  const isNewBlocked = !existingPostingId && lockUntil && new Date(lockUntil) > new Date();
  const hoursLeft = isNewBlocked && lockUntil
    ? Math.ceil((new Date(lockUntil).getTime() - Date.now()) / (1000 * 60 * 60))
    : 0;

  const togglePosition = (pos: PositionType) => {
    if (selectedPositions.includes(pos)) {
      setSelectedPositions((prev) => prev.filter((p) => p !== pos));
    } else if (selectedPositions.length < 4) {
      setSelectedPositions((prev) => [...prev, pos]);
    } else {
      toast('모집교사 유형은 최대 4개까지 선택 가능합니다.', 'error');
    }
  };

  const addArea = () => {
    const trimmed = areaInput.trim();
    if (!trimmed) return;
    if (commuteAreas.length >= 3) { toast('출퇴근 가능지역은 최대 3개까지입니다.', 'error'); return; }
    if (commuteAreas.includes(trimmed)) { toast('이미 추가된 지역입니다.', 'error'); return; }
    setCommuteAreas((prev) => [...prev, trimmed]);
    setAreaInput('');
  };

  const removeArea = (idx: number) => setCommuteAreas((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || submitting) return;

    if (!title.trim()) { toast('공고 제목을 입력해주세요.', 'error'); return; }
    if (selectedPositions.length === 0) { toast('모집교사 유형을 최소 1개 선택해주세요.', 'error'); return; }
    if (!description.trim()) { toast('공고 내용을 입력해주세요.', 'error'); return; }
    if (!deadline.trim()) { toast('마감일을 입력해주세요.', 'error'); return; }

    if (isNewBlocked) {
      toast(`공고 등록 후 48시간 동안은 새 공고를 올릴 수 없습니다. (${hoursLeft}시간 남음)`, 'error');
      return;
    }

    if (!existingPostingId) {
      if (!confirm('공고를 등록하시겠습니까?\n등록 후 48시간 동안은 다른 공고를 올릴 수 없습니다. 수정/삭제는 언제든 가능합니다.')) return;
    }

    setSubmitting(true);
    const supabase = createClient();
    const deadlineISO = dateToISO(deadline);

    let postingId = existingPostingId;

    if (postingId) {
      // 수정: 락 갱신 없이 저장만
      const { error } = await supabase.from('postings')
        .update({ title, description, deadline: deadlineISO, commute_areas: commuteAreas })
        .eq('id', postingId);
      if (error) { toast('공고 수정 중 오류가 발생했습니다.', 'error'); setSubmitting(false); return; }
      await supabase.from('position_entries').delete().eq('posting_id', postingId);
    } else {
      // 신규: posting insert + institution 락 갱신
      const { data, error } = await supabase.from('postings')
        .insert({ institution_id: user.id, title, description, deadline: deadlineISO, commute_areas: commuteAreas })
        .select('id')
        .single();
      if (error) { toast('공고 등록 중 오류가 발생했습니다.', 'error'); setSubmitting(false); return; }
      postingId = data?.id ?? null;

      const newLockUntil = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
      await supabase.from('institution_profiles')
        .update({ last_posting_locked_until: newLockUntil })
        .eq('id', user.id);
    }

    if (!postingId) { toast('공고 처리 중 오류가 발생했습니다.', 'error'); setSubmitting(false); return; }

    // 선택된 포지션별로 엔트리 생성 (상세는 description 텍스트 안에 포함)
    const entries = selectedPositions.map((pos) => ({
      posting_id: postingId!,
      position: pos,
      age_group: '무관' as const,
      headcount: 1,
      employment_type: '정규직' as const,
      salary: '',
      work_hours: '',
    }));

    if (entries.length > 0) {
      await supabase.from('position_entries').insert(entries);
    }

    toast(existingPostingId ? '공고가 수정되었습니다' : '공고가 등록되었습니다');
    router.push(`/jobs/${postingId}`);
  };

  if (profile?.user_type !== 'institution') return null;
  if (loadingExisting) return <PageSpinner />;

  const inst = institutionProfile;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-lg font-bold text-foreground mb-1">
        {existingPostingId ? '채용공고 수정' : '채용공고 등록'}
      </h1>
      <p className="text-xs text-muted mb-3">공고 내용을 작성해주세요.</p>

      {!existingPostingId && (
        <div className={`rounded-lg p-3 mb-4 text-xs leading-[1.7] ${isNewBlocked ? 'bg-[#E86830]/10 border border-[#E86830]/30 text-[#E86830]' : 'bg-[#EAF5EC] border border-[#A5D6A7]/50 text-foreground/80'}`}>
          {isNewBlocked ? (
            <>공고 등록 후 48시간 동안은 새 공고를 올릴 수 없습니다. <b>{hoursLeft}시간 남음.</b></>
          ) : (
            <>공고 등록 후 48시간 동안은 다른 공고를 올릴 수 없습니다. 수정과 삭제는 언제든 가능합니다.<br />담임교사와 부담임교사 모두 구하실 땐 한 공고에 함께 등록해 주세요.</>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* 기관 정보 (자동) */}
        {inst && (
          <section className="bg-white border border-border rounded-xl overflow-hidden">
            <div className="flex">
              <div className="w-[240px] min-h-[240px] self-stretch bg-[#F7FAF6] flex items-center justify-center flex-shrink-0 border-r border-border overflow-hidden">
                {inst.photos?.[0] ? (
                  <img src={inst.photos[0]} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-center">
                    <Icon name="home" size={40} className="text-muted/20 mx-auto" />
                    <p className="text-[10px] text-muted/40 mt-1">기관 사진</p>
                  </div>
                )}
              </div>
              <div className="flex-1 p-5">
                <h2 className="text-lg font-bold text-foreground mb-2">{inst.name}</h2>
                <div className="space-y-1.5 text-xs">
                  <div className="flex">
                    <span className="text-muted w-[70px] flex-shrink-0">주소</span>
                    <span className="text-foreground">{inst.address}</span>
                  </div>
                  <div className="flex">
                    <span className="text-muted w-[70px] flex-shrink-0">연락처</span>
                    <span className="text-foreground">{inst.phone}</span>
                  </div>
                  <div className="flex">
                    <span className="text-muted w-[70px] flex-shrink-0">이메일</span>
                    <span className="text-foreground">{inst.email}</span>
                  </div>
                  {inst.nearby_stations && inst.nearby_stations.length > 0 && (
                    <div className="flex">
                      <span className="text-muted w-[70px] flex-shrink-0">가까운 역</span>
                      <span className="text-foreground">{inst.nearby_stations.filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex">
                    <span className="text-muted w-[70px] flex-shrink-0">운영반</span>
                    <span className="text-foreground">{inst.class_count || '-'}개</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 공고 제목 */}
        <section className="bg-white border border-border rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">공고 제목</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 2026년 상반기 교사 모집" className="input-field" />
          </div>

          {/* 모집교사 유형 (태그) */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">모집교사 유형 (최대 4개)</label>
            <div className="flex flex-wrap gap-2">
              {POSITIONS.map((pos) => {
                const selected = selectedPositions.includes(pos);
                const colors = POSITION_COLORS[pos];
                return (
                  <button key={pos} type="button" onClick={() => togglePosition(pos)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
                      selected ? `${colors.bg} ${colors.text} border-current` : 'bg-white text-foreground/70 border-border hover:border-[#A5D6A7]'
                    }`}>
                    {pos} {selected && 'x'}
                  </button>
                );
              })}
            </div>
            {selectedPositions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {selectedPositions.map((pos, i) => {
                  const colors = POSITION_COLORS[pos];
                  return (
                    <span key={i} className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full ${colors.bg} ${colors.text}`}>
                      {pos}
                      <button type="button" onClick={() => setSelectedPositions((prev) => prev.filter((_, j) => j !== i))} className="hover:text-danger">x</button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* 출퇴근 가능지역 */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-2">출퇴근 가능지역 (최대 3개)</label>
            <div className="flex gap-2">
              <input type="text" value={areaInput} onChange={(e) => setAreaInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); addArea(); } }}
                placeholder="예: 강남구" className="input-field flex-1" />
              <button type="button" onClick={addArea} className="px-4 h-[42px] text-xs font-semibold bg-[#EAF5EC] text-[#4EA85E] rounded-[10px] hover:bg-[#A5D6A7]/40 flex-shrink-0">추가</button>
            </div>
            {commuteAreas.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {commuteAreas.map((area, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#F7FAF6] text-foreground/70 text-[11px] font-semibold rounded-full border border-border">
                    {area}
                    <button type="button" onClick={() => removeArea(i)} className="hover:text-danger">x</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 공고 내용 (통 텍스트) */}
        <section className="bg-white border border-border rounded-xl p-5">
          <label className="block text-xs font-semibold text-foreground mb-1">공고 내용</label>
          <p className="text-[11px] text-muted mb-2">모집교사 유형별 급여, 근무시간, 자격요건 등을 자유롭게 작성해주세요.</p>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`[담임교사]\n- 급여: 월 250만원\n- 근무시간: 09:00~18:00\n- 자격요건: 유치원정교사 2급 이상\n\n[보조교사]\n- 급여: 월 200만원\n- 근무시간: 09:00~17:00\n...`}
            className="input-field"
            style={{ minHeight: 280 }}
          />
        </section>

        {/* 마감일 (자동 한달, 수정불가) */}
        <section className="bg-white border border-border rounded-xl p-5">
          <label className="block text-xs font-semibold text-foreground mb-1">모집 마감일</label>
          <div className="flex items-center gap-3">
            <input type="text" value={deadline} readOnly className="input-field max-w-[200px] bg-gray-50 text-muted" />
            <span className="text-[11px] text-muted">등록일로부터 1개월 자동 설정</span>
          </div>
        </section>

        {/* 하단 버튼 */}
        <div className="flex gap-2">
          <Link href="/jobs" className="flex-1 py-3 text-center border border-border text-foreground/70 font-medium rounded-xl hover:bg-white text-sm">
            취소
          </Link>
          <button type="submit" disabled={submitting || Boolean(isNewBlocked)}
            className="flex-1 py-3 bg-[#66c477] hover:bg-[#4EA85E] text-white font-semibold rounded-xl disabled:opacity-50 text-sm flex items-center justify-center">
            {submitting ? <ButtonSpinner /> : existingPostingId ? '공고 수정' : '공고 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
