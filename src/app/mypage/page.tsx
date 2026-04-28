'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { PageSpinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import type { Resume, Application, ApplicationStatus, Posting, PositionEntry, InstitutionProfile, TeacherProfile } from '@/types/database';

interface TeacherApplication extends Application {
  postings: Posting & { institution_profiles: InstitutionProfile };
  position_entries: PositionEntry;
}

interface InstitutionApplication extends Application {
  teacher_profiles: TeacherProfile;
  resumes: Resume;
  position_entries: PositionEntry;
}

// 교사 지원 내역 읽기 전용 표시용 (기관 드롭다운은 제거됨, 교사는 기관이 설정한 상태를 봄)
const statusColors: Record<ApplicationStatus, string> = {
  '검토중': 'bg-secondary text-primary-dark',
  '면접요청': 'bg-success/10 text-success',
  '합격': 'bg-success/15 text-success',
  '불합격': 'bg-danger/10 text-danger',
};

export default function MyPage() {
  const router = useRouter();
  const { user, profile, teacherProfile, institutionProfile, loading: authLoading, profileLoaded } = useAuth();
  const supabase = createClient();
  const { toast } = useToast();

  const [resume, setResume] = useState<Resume | null>(null);
  const [teacherApps, setTeacherApps] = useState<TeacherApplication[]>([]);
  const [posting, setPosting] = useState<(Posting & { position_entries: PositionEntry[] }) | null>(null);
  const [institutionApps, setInstitutionApps] = useState<InstitutionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const handleDeletePosting = async () => {
    if (!posting || !confirm('공고를 삭제하시겠습니까? 관련 지원서도 모두 삭제됩니다.')) return;
    await supabase.from('postings').delete().eq('id', posting.id);
    setPosting(null);
    setInstitutionApps([]);
    toast('공고가 삭제되었습니다');
  };

  const handleCancelApplication = async (appId: string) => {
    if (!confirm('지원을 취소하시겠습니까?')) return;
    await supabase.from('applications').delete().eq('id', appId);
    setTeacherApps((prev) => prev.filter((a) => a.id !== appId));
    toast('지원이 취소되었습니다');
  };

  const [deleting, setDeleting] = useState(false);
  const handleDeleteAccount = async () => {
    if (!confirm('정말로 회원탈퇴 하시겠습니까?\n모든 데이터가 삭제되며 복구할 수 없습니다.')) return;
    if (!confirm('한 번 더 확인합니다. 탈퇴하시겠습니까?')) return;
    setDeleting(true);
    // 서버 함수로 auth.users + profiles(CASCADE) 삭제
    await supabase.rpc('delete_own_account');
    await supabase.auth.signOut();
    toast('회원탈퇴가 완료되었습니다');
    router.push('/');
    router.refresh();
  };

  useEffect(() => {
    // proxy가 미인증 시 /login으로 보내므로 여기서는 클라 redirect를 하지 않는다.
    // hydration 중일 수 있어 user가 잠시 null인 순간이 있을 수 있다 → 그냥 대기.
    if (authLoading || !user) return;
    if (!profileLoaded) return;
    if (!profile) {
      router.replace('/signup');
      return;
    }

    async function fetchTeacherData() {
      const [resumeRes, appsRes] = await Promise.all([
        supabase
          .from('resumes')
          .select('*')
          .eq('teacher_id', user!.id)
          .single(),
        supabase
          .from('applications')
          .select('*, postings(*, institution_profiles(*)), position_entries(*)')
          .eq('teacher_id', user!.id)
          .order('applied_at', { ascending: false }),
      ]);

      setResume(resumeRes.data);
      setTeacherApps((appsRes.data as unknown as TeacherApplication[]) || []);
      setLoading(false);
    }

    async function fetchInstitutionData() {
      const [postingRes, appsRes] = await Promise.all([
        supabase
          .from('postings')
          .select('*, position_entries(*)')
          .eq('institution_id', user!.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single(),
        supabase
          .from('applications')
          .select('*, teacher_profiles!applications_teacher_id_fkey(*), resumes(*), position_entries(*), postings!inner(*)')
          .eq('postings.institution_id', user!.id)
          .order('applied_at', { ascending: false }),
      ]);

      setPosting(postingRes.data as unknown as (Posting & { position_entries: PositionEntry[] }) | null);
      setInstitutionApps((appsRes.data as unknown as InstitutionApplication[]) || []);
      setLoading(false);
    }

    if (profile!.user_type === 'teacher') {
      fetchTeacherData();
    } else {
      fetchInstitutionData();
    }
  }, [user, profile, profileLoaded, authLoading, router, supabase]);

  const markAsViewed = async (applicationId: string) => {
    const app = institutionApps.find((a) => a.id === applicationId);
    if (app?.viewed_at) return;
    const now = new Date().toISOString();
    await supabase.from('applications').update({ viewed_at: now }).eq('id', applicationId);
    setInstitutionApps((prev) =>
      prev.map((a) => (a.id === applicationId ? { ...a, viewed_at: now } : a))
    );
  };

  if (authLoading || loading) {
    return <PageSpinner />;
  }

  const isTeacher = profile?.user_type === 'teacher';

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <h1 className="text-lg font-bold text-foreground mb-5">마이페이지</h1>

      {isTeacher ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Profile Summary */}
          <div className="space-y-4">
            <div className="bg-white border border-border rounded-lg p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#EAF5EC] flex items-center justify-center overflow-hidden">
                  {teacherProfile?.photo_url ? (
                    <img src={teacherProfile.photo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Icon name="user" size={24} className="text-[#66c477]" />
                  )}
                </div>
                <div>
                  <h2 className="text-sm font-bold text-foreground">{teacherProfile?.name}</h2>
                  <p className="text-xs text-muted">{teacherProfile?.phone}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">이메일</span>
                  <span className="text-foreground">{profile?.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">연락처</span>
                  <span className="text-foreground">{teacherProfile?.phone}</span>
                </div>
              </div>
              <Link href="/mypage/edit" className="block mt-4 text-center py-2 border border-border text-xs font-medium rounded-lg hover:bg-background transition-colors">
                내 정보 수정
              </Link>
            </div>

            {/* Resume Status */}
            <div className="bg-white border border-border rounded-lg p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">내 이력서</h2>
              {resume ? (
                <div className="space-y-2">
                  <p className="text-xs text-foreground/70">이력서가 등록되어 있습니다.</p>
                  <div className="flex gap-2">
                    <Link href={`/talents/${user?.id}`} className="flex-1 text-center py-2 border border-border text-xs font-medium rounded-lg hover:bg-background transition-colors">보기</Link>
                    <Link href="/resume/edit" className="flex-1 text-center py-2 bg-[#4EA85E] text-white text-xs font-semibold rounded-lg hover:bg-[#459e53] transition-colors">수정</Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-3">
                  <p className="text-xs text-muted mb-3">이력서를 작성해주세요</p>
                  <Link href="/resume/edit" className="inline-block px-4 py-2 bg-[#4EA85E] text-white text-xs font-semibold rounded-lg hover:bg-[#459e53] transition-colors">이력서 작성</Link>
                </div>
              )}
            </div>
          </div>

          {/* Application History */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-bold text-foreground mb-3">지원 현황</h2>
            {teacherApps.length === 0 ? (
              <div className="bg-white border border-border rounded-lg p-8 text-center">
                <p className="text-xs text-muted mb-2">지원한 공고가 없습니다.</p>
                <Link href="/jobs" className="text-xs text-[#4EA85E] hover:underline">공고 보러가기</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {teacherApps.map((app) => (
                  <div key={app.id} className="bg-white border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/jobs/${app.posting_id}`} className="text-xs font-semibold text-foreground hover:text-[#4EA85E] truncate block">
                          {app.postings.title}
                        </Link>
                        <p className="text-[11px] text-muted mt-0.5">
                          {app.postings.institution_profiles.name} / {app.position_entries.position}
                        </p>
                      </div>
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${statusColors[app.status]}`}>
                        {app.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[11px] text-muted">지원일: {new Date(app.applied_at).toLocaleDateString('ko-KR')}</p>
                      {app.status === '검토중' && (
                        <button
                          onClick={() => handleCancelApplication(app.id)}
                          className="text-[11px] text-danger hover:underline font-semibold"
                        >
                          지원 취소
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Institution Info */}
          <div className="bg-white border border-border rounded-lg p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#EAF5EC] flex items-center justify-center overflow-hidden">
                {institutionProfile?.photos?.[0] ? (
                  <img src={institutionProfile.photos[0]} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="building" size={24} className="text-[#66c477]" />
                )}
              </div>
              <div>
                <h2 className="text-sm font-bold text-foreground">{institutionProfile?.name}</h2>
                <p className="text-xs text-muted">{institutionProfile?.type}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">주소</span>
                <span className="text-foreground">{institutionProfile?.address_short}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">연락처</span>
                <span className="text-foreground">{institutionProfile?.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">원장</span>
                <span className="text-foreground">{institutionProfile?.director_name}</span>
              </div>
            </div>
            <Link href="/mypage/edit" className="block mt-4 text-center py-2 border border-border text-xs font-medium rounded-lg hover:bg-background transition-colors">
              기관 정보 수정
            </Link>
          </div>

          {/* My Posting */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground">내 채용공고</h2>
              {!posting && (
                <Link href="/jobs/new" className="px-3 py-1.5 text-xs font-semibold text-white bg-[#4EA85E] rounded hover:bg-[#459e53] transition-colors">공고 등록</Link>
              )}
            </div>
            {posting ? (() => {
              const expired = new Date(posting.deadline).getTime() < Date.now();
              return (
                <div className={`bg-white border rounded-lg p-4 ${expired ? 'border-border/50 opacity-60' : 'border-border'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Link href={`/jobs/${posting.id}`} className="text-xs font-semibold text-foreground hover:text-[#4EA85E]">{posting.title}</Link>
                      {expired && <span className="ml-2 text-[10px] text-danger font-semibold">만료됨</span>}
                    </div>
                    <div className="flex gap-2">
                      {!expired && <Link href="/jobs/new" className="text-[11px] text-[#4EA85E] hover:underline">수정</Link>}
                      <button onClick={handleDeletePosting} className="text-[11px] text-danger hover:underline">삭제</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted">마감: {new Date(posting.deadline).toLocaleDateString('ko-KR')}</p>
                  <p className="text-[11px] text-muted mt-0.5">모집 직무: {posting.position_entries.length}건</p>
                  {expired && (
                    <Link href="/jobs/new" className="inline-block mt-2 text-[11px] text-[#4EA85E] font-semibold hover:underline">새 공고 등록하기</Link>
                  )}
                </div>
              );
            })() : (
              <div className="bg-white border border-border rounded-lg p-8 text-center">
                <p className="text-xs text-muted mb-2">등록된 공고가 없습니다.</p>
                <Link href="/jobs/new" className="text-xs text-[#4EA85E] hover:underline">공고 등록하기</Link>
              </div>
            )}
          </div>

          {/* Received Applications */}
          <div>
            <h2 className="text-sm font-bold text-foreground mb-3">받은 지원서</h2>
            {institutionApps.length === 0 ? (
              <div className="bg-white border border-border rounded-lg p-8 text-center">
                <p className="text-xs text-muted">아직 지원서가 없습니다.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {institutionApps.map((app) => (
                  <Link
                    key={app.id}
                    href={`/talents/${app.teacher_id}`}
                    onClick={() => markAsViewed(app.id)}
                    className={`block bg-white border rounded-lg p-4 transition-all hover:shadow-sm ${
                      app.viewed_at ? 'border-border' : 'border-[#A5D6A7] bg-[#F7FAF6]'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-[13px]">
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center ${
                        app.viewed_at ? 'bg-gray-100 text-muted' : 'bg-[#EAF5EC] text-[#4EA85E]'
                      }`}>
                        <span className="text-xs font-semibold">{app.teacher_profiles.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5 sm:grid sm:grid-cols-3 sm:gap-2 sm:items-center">
                        <span className="text-muted text-[12px] truncate">
                          이름 · <span className="text-foreground font-semibold">{app.teacher_profiles.name}</span>
                        </span>
                        <span className="text-muted text-[12px] truncate">
                          지원분야 · <span className="text-foreground">{app.position_entries.position}</span>
                        </span>
                        <span className="text-muted text-[12px] truncate">
                          지원일 · <span className="text-foreground">{new Date(app.applied_at).toLocaleDateString('ko-KR')}</span>
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold flex-shrink-0 px-2 py-1 rounded-full ${
                        app.viewed_at ? 'bg-gray-100 text-muted' : 'bg-[#E86830]/10 text-[#E86830]'
                      }`}>
                        {app.viewed_at ? '확인' : '미확인'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 회원탈퇴 */}
      <div className="mt-10 pt-6 border-t border-border">
        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className="text-xs text-muted hover:text-danger transition-colors"
        >
          {deleting ? '처리 중...' : '회원탈퇴'}
        </button>
      </div>
    </div>
  );
}
