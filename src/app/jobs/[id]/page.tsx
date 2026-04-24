'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { PageSpinner, ButtonSpinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import type { PostingWithPositions, PositionEntry, Resume } from '@/types/database';
import { POSITION_COLORS, type PositionType } from '@/constants/positions';

function getDaysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useAuth();
  const postingId = params.id as string;
  const { toast } = useToast();

  const [posting, setPosting] = useState<(PostingWithPositions & { commute_areas?: string[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [resume, setResume] = useState<Resume | null>(null);
  const [appliedPositions, setAppliedPositions] = useState<string[]>([]);
  const [applyingFor, setApplyingFor] = useState<PositionEntry | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('postings')
      .select('*, position_entries(*), institution_profiles!inner(*)')
      .eq('id', postingId)
      .single()
      .then(({ data }: { data: typeof posting }) => { setPosting(data); setLoading(false); });
  }, [postingId]);

  useEffect(() => {
    if (!user || profile?.user_type !== 'teacher') return;
    const supabase = createClient();
    supabase.from('resumes').select('*').eq('teacher_id', user.id).single()
      .then(({ data }: { data: Resume | null }) => setResume(data));
    supabase.from('applications').select('position_entry_id').eq('posting_id', postingId).eq('teacher_id', user.id)
      .then(({ data }: { data: { position_entry_id: string }[] | null }) => { if (data) setAppliedPositions(data.map((a) => a.position_entry_id)); });
  }, [user, profile, postingId]);

  const handleApply = (pe: PositionEntry) => {
    if (!user) { router.push('/login'); return; }
    if (!resume) return;
    setApplyingFor(pe);
    setMessage('');
  };

  const handleSubmitApplication = async () => {
    if (!applyingFor || !resume || !user || !posting) return;
    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from('applications').insert({
      posting_id: posting.id,
      position_entry_id: applyingFor.id,
      teacher_id: user.id,
      resume_id: resume.id,
      message,
      answers: [],
      status: '검토중',
    });

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: posting.institution_id,
        type: 'application_received',
        title: '새로운 지원서가 도착했습니다',
        message: `${posting.title} - ${applyingFor.position} 포지션에 지원서가 접수되었습니다.`,
        link: '/mypage',
        read: false,
      });
      setAppliedPositions((prev) => [...prev, applyingFor.id]);
      setApplyingFor(null);
      toast('지원이 완료되었습니다');
    } else {
      toast('지원 중 오류가 발생했습니다.', 'error');
    }
    setSubmitting(false);
  };

  if (loading) return <PageSpinner />;
  if (!posting) return (
    <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
      <p className="text-sm text-muted">공고를 찾을 수 없습니다.</p>
      <Link href="/jobs" className="mt-3 inline-block text-xs text-[#4EA85E] hover:underline">목록으로</Link>
    </div>
  );

  const inst = posting.institution_profiles;
  const positions = posting.position_entries;
  const daysLeft = getDaysLeft(posting.deadline);
  const isTeacher = profile?.user_type === 'teacher';

  return (
    <>
      <div className="max-w-[800px] mx-auto px-4 py-6">
        {/* 뒤로가기 */}
        <Link href="/jobs" className="inline-flex items-center gap-1 text-xs text-muted hover:text-[#4EA85E] mb-4">
          <Icon name="arrow-left" size={14} />
          <span>채용공고 목록으로</span>
        </Link>

        {/* 기관 정보 */}
        <section className="bg-white border border-border rounded-xl overflow-hidden mb-4">
          <div className="flex flex-col sm:flex-row">
            {/* 사진 */}
            <Link href={`/institutions/${posting.institution_id}`} className="w-full h-48 sm:w-[240px] sm:h-auto sm:min-h-[240px] sm:self-stretch bg-[#F7FAF6] flex items-center justify-center flex-shrink-0 sm:border-r border-b sm:border-b-0 border-border overflow-hidden">
              {inst.photos?.[0] ? (
                <img src={inst.photos[0]} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center">
                  <Icon name="home" size={40} className="text-muted/20 mx-auto" />
                  <p className="text-[10px] text-muted/40 mt-1">기관 사진</p>
                </div>
              )}
            </Link>
            {/* 정보 */}
            <div className="flex-1 p-5 min-w-0">
              <div className="flex items-start justify-between mb-3">
                <Link href={`/institutions/${posting.institution_id}`} className="text-lg font-bold text-foreground hover:text-[#4EA85E]">
                  {inst.name}
                </Link>
                <span className={`text-xs font-bold flex-shrink-0 ml-3 ${daysLeft > 7 ? 'text-[#4EA85E]' : daysLeft > 0 ? 'text-[#E86830]' : 'text-muted'}`}>
                  {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
                </span>
              </div>
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
                {inst.director_name && (
                  <div className="flex">
                    <span className="text-muted w-[70px] flex-shrink-0">원장</span>
                    <span className="text-foreground">{inst.director_name}</span>
                  </div>
                )}
                {inst.class_count && (
                  <div className="flex">
                    <span className="text-muted w-[70px] flex-shrink-0">운영반</span>
                    <span className="text-foreground">{inst.class_count}개</span>
                  </div>
                )}
                {inst.type && (
                  <div className="flex">
                    <span className="text-muted w-[70px] flex-shrink-0">설립유형</span>
                    <span className="text-foreground">{inst.type}</span>
                  </div>
                )}
              </div>
              <p className="text-[11px] text-muted mt-2">마감일: {posting.deadline}</p>
            </div>
          </div>
        </section>

        {/* 공고 제목 + 모집교사 태그 + 출퇴근 지역 */}
        <section className="bg-white border border-border rounded-xl p-5 mb-4">
          <h1 className="text-lg font-bold text-foreground mb-3">{posting.title}</h1>

          {positions.length > 0 && (
            <div className="mb-3">
              <p className="text-[11px] text-muted mb-1.5">모집교사</p>
              <div className="flex flex-wrap gap-1.5">
                {positions.map((pe) => {
                  const colors = POSITION_COLORS[pe.position as PositionType];
                  return (
                    <span key={pe.id} className={`px-2.5 py-1 text-[11px] font-semibold rounded-full ${colors?.bg ?? 'bg-[#EAF5EC]'} ${colors?.text ?? 'text-[#4EA85E]'}`}>
                      {pe.position}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {posting.commute_areas && posting.commute_areas.length > 0 && (
            <div>
              <p className="text-[11px] text-muted mb-1.5">출퇴근 가능지역</p>
              <div className="flex flex-wrap gap-1.5">
                {posting.commute_areas.map((area, i) => (
                  <span key={i} className="px-2.5 py-1 bg-[#F7FAF6] text-foreground/70 text-[11px] font-semibold rounded-full border border-border">
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* 공고 내용 (통 텍스트) */}
        <section className="bg-white border border-border rounded-xl p-5 mb-4">
          <h2 className="text-sm font-bold text-foreground mb-3">공고 내용</h2>
          <div className="text-[13px] text-foreground/80 leading-[1.8] whitespace-pre-wrap">
            {posting.description}
          </div>
        </section>

        {/* 지원하기 — 포지션별 버튼 (구직자만) */}
        {isTeacher && daysLeft > 0 && (
          <section className="bg-white border border-border rounded-xl p-5 mb-4">
            <h2 className="text-sm font-bold text-foreground mb-3">지원하기</h2>
            {!resume ? (
              <div className="text-center py-4">
                <p className="text-xs text-muted mb-2">이력서를 먼저 작성해야 지원할 수 있습니다.</p>
                <Link href="/resume/edit" className="inline-block px-4 py-2 text-xs font-semibold bg-[#4EA85E] text-white rounded-lg hover:bg-[#3d8b4c]">이력서 작성하기</Link>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {positions.map((pe) => {
                  const alreadyApplied = appliedPositions.includes(pe.id);
                  return alreadyApplied ? (
                    <span key={pe.id} className="px-4 py-2 text-xs font-semibold bg-[#EAF5EC] text-[#4EA85E] rounded-lg">
                      {pe.position} 지원완료
                    </span>
                  ) : (
                    <button key={pe.id} onClick={() => handleApply(pe)}
                      className="px-4 py-2 text-xs font-semibold bg-[#66c477] text-white rounded-lg hover:bg-[#4EA85E]">
                      {pe.position} 지원
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {daysLeft === 0 && (
          <section className="bg-white border border-border rounded-xl p-5 mb-4 text-center">
            <p className="text-sm text-muted">마감된 공고입니다.</p>
          </section>
        )}
      </div>

      {/* 지원 모달 */}
      {applyingFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/30" onClick={() => setApplyingFor(null)} />
          <div className="relative bg-white rounded-xl border border-border w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto">
            <h2 className="text-base font-bold text-foreground mb-0.5">지원하기</h2>
            <p className="text-[11px] text-muted">{inst.name} - {applyingFor.position}</p>

            <div className="mt-4 space-y-4">
              <div className="bg-[#EAF5EC] rounded-lg p-3">
                <p className="text-xs font-medium text-[#4EA85E]">내 이력서가 자동으로 첨부됩니다</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">지원 메시지</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)}
                  placeholder="지원 동기를 간략히 작성해주세요." className="input-field" style={{ minHeight: 100 }} />
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setApplyingFor(null)} className="flex-1 py-2.5 border border-border text-foreground/70 font-medium rounded-xl text-sm">취소</button>
              <button onClick={handleSubmitApplication} disabled={submitting}
                className="flex-1 py-2.5 bg-[#66c477] hover:bg-[#4EA85E] text-white font-semibold rounded-xl text-sm disabled:opacity-50 flex items-center justify-center">
                {submitting ? <ButtonSpinner /> : '지원 제출'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
