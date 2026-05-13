'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';
import { PageSpinner } from '@/components/Spinner';
import { useAuth } from '@/contexts/AuthContext';
import type { Resume, TeacherProfile } from '@/types/database';

type ResumeWithProfile = Resume & { teacher_profiles: TeacherProfile };

export default function TalentsPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [resumes, setResumes] = useState<ResumeWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user || profile?.user_type !== 'institution') { setLoading(false); return; }
    const supabase = createClient();
    // 자기 기관 공고에 지원(취소 제외)한 교사 ID 목록 조회
    supabase
      .from('applications')
      .select('teacher_id, postings!inner(institution_id)')
      .eq('postings.institution_id', user.id)
      .neq('status', '지원취소')
      .then(async ({ data: apps }) => {
        if (!apps || apps.length === 0) { setLoading(false); return; }
        const teacherIds = [...new Set(apps.map((a) => a.teacher_id as string))];
        const { data } = await supabase
          .from('resumes')
          .select('*, teacher_profiles(*)')
          .in('teacher_id', teacherIds)
          .order('updated_at', { ascending: false });
        setResumes((data as ResumeWithProfile[]) ?? []);
        setLoading(false);
      });
  }, [authLoading, user, profile]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return resumes;
    const q = searchQuery.toLowerCase();
    return resumes.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.affiliation?.toLowerCase().includes(q) ||
      (r.certificates as { name: string }[])?.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [resumes, searchQuery]);

  if (authLoading || loading) return <PageSpinner />;

  if (profile?.user_type !== 'institution') {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <Icon name="user" size={40} className="text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">접근 권한이 없습니다</p>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <Icon name="user" size={40} className="text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">아직 지원한 인재가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <h1 className="text-lg font-bold text-foreground mb-4">인재정보</h1>

      <div className="relative mb-4 max-w-[480px]">
        <Icon name="search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이름, 자격증, 소속으로 검색" className="input-field" style={{ paddingLeft: 36 }} />
      </div>

      <p className="text-xs text-muted mb-3">총 <span className="font-semibold text-foreground">{filtered.length}</span>명</p>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => {
            const certs = (r.certificates as { name: string }[]) || [];
            const exps = (r.experiences as { institution: string }[]) || [];
            return (
              <Link key={r.id} href={`/talents/${r.teacher_id}`}
                className="bg-white border border-border rounded-xl p-4 hover:border-[#A5D6A7] hover:shadow-sm transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-full bg-[#EAF5EC] flex items-center justify-center overflow-hidden flex-shrink-0">
                    {r.photo_url ? (
                      <img src={r.photo_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Icon name="user" size={20} className="text-[#66c477]" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">{r.name}</p>
                    <p className="text-[11px] text-muted">{r.affiliation || '미입력'}</p>
                  </div>
                </div>
                {certs.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {certs.slice(0, 3).map((c, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#EAF5EC] text-[#4EA85E] rounded-full">{c.name}</span>
                    ))}
                  </div>
                )}
                <div className="text-[11px] text-muted">
                  경력 {exps.length}건
                  <span className="mx-1">|</span>
                  {new Date(r.updated_at).toLocaleDateString('ko-KR')} 갱신
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white border border-border rounded-xl">
          <Icon name="user" size={32} className="text-muted/30 mx-auto mb-2" />
          <p className="text-sm text-muted">아직 지원한 인재가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
