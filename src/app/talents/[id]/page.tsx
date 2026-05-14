'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { PageSpinner } from '@/components/Spinner';
import type { Resume, TeacherProfile } from '@/types/database';

function calcAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
  return age;
}

function formatBirth(d: string) { return d.replace(/-/g, '/'); }

interface Exp { institution: string; startDate?: string; endDate?: string; isCurrent?: boolean; period?: string; role: string; age_group: string }

const RESUME_WIDTH = 720;

export default function ResumeViewPage() {
  const params = useParams();
  const router = useRouter();
  const teacherId = params.id as string;
  const { user, profile } = useAuth();
  const supabase = createClient();
  const resumeRef = React.useRef<HTMLDivElement>(null);
  const scaleWrapperRef = React.useRef<HTMLDivElement>(null);

  const [resume, setResume] = useState<Resume | null>(null);
  const [tp, setTp] = useState<TeacherProfile | null>(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState<number | null>(null);
  // 기관이 볼 때만: 이 교사가 내 공고에 지원한 포지션들 (취소 제외, 중복 제거)
  const [appliedPositions, setAppliedPositions] = useState<string[]>([]);
  const [appliedLoading, setAppliedLoading] = useState(true);
  const isOwner = user?.id === teacherId;
  const isInstitutionViewer = profile?.user_type === 'institution' && !isOwner;

  useEffect(() => {
    Promise.all([
      supabase.from('resumes').select('*').eq('teacher_id', teacherId).single(),
      supabase.from('teacher_profiles').select('*').eq('id', teacherId).single(),
      supabase.from('profiles').select('email').eq('id', teacherId).single(),
    ]).then(([r, p, prof]) => {
      setResume(r.data);
      setTp(p.data);
      setEmail((prof.data as { email: string } | null)?.email ?? '');
      setLoading(false);
    });
  }, [teacherId, supabase]);

  // 기관 시점에서만 지원 이력 조회. RLS가 자기 공고 application만 허용하므로 안전.
  useEffect(() => {
    if (!isInstitutionViewer || !user?.id) { setAppliedPositions([]); setAppliedLoading(false); return; }
    supabase
      .from('applications')
      .select('position_entries(position), postings!inner(institution_id), applied_at')
      .eq('teacher_id', teacherId)
      .eq('postings.institution_id', user.id)
      .neq('status', '지원취소')
      .order('applied_at', { ascending: false })
      .then(({ data }) => {
        if (!data) { setAppliedLoading(false); return; }
        const seen = new Set<string>();
        const positions: string[] = [];
        for (const row of data as unknown as { position_entries: { position: string } | null }[]) {
          const pos = row.position_entries?.position;
          if (pos && !seen.has(pos)) { seen.add(pos); positions.push(pos); }
        }
        setAppliedPositions(positions);
        setAppliedLoading(false);
      });
  }, [isInstitutionViewer, user?.id, teacherId, supabase]);

  useEffect(() => {
    if (loading) return;
    const update = () => {
      if (!scaleWrapperRef.current || !resumeRef.current) return;
      const wrapperWidth = scaleWrapperRef.current.clientWidth;
      const s = Math.min(1, wrapperWidth / RESUME_WIDTH);
      setScale(s);
      setInnerHeight(resumeRef.current.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    if (scaleWrapperRef.current) ro.observe(scaleWrapperRef.current);
    if (resumeRef.current) ro.observe(resumeRef.current);
    return () => ro.disconnect();
  }, [loading]);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    const el = resumeRef.current;
    const origTransform = el.style.transform;
    el.style.transform = 'none';
    try {
      const { generateResumePdf } = await import('@/lib/resumePdf');
      await generateResumePdf(el, `이력서_${resume?.name || ''}.pdf`);
    } finally {
      el.style.transform = origTransform;
    }
  };

  const handlePrint = () => window.print();

  if (loading) return <PageSpinner />;

  if (!resume) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <Icon name="user" size={40} className="text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">이력서를 찾을 수 없습니다</p>
      </div>
    );
  }

  // 교사가 타인 이력서 접근 시 차단 (본인 이력서는 허용)
  if (profile?.user_type === 'teacher' && !isOwner) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <Icon name="user" size={40} className="text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">접근 권한이 없습니다</p>
      </div>
    );
  }

  // 기관 로그인 시: 지원 이력 로딩 중
  if (isInstitutionViewer && appliedLoading) return <PageSpinner />;

  // 기관 로그인 시: 이 교사가 해당 기관에 지원한 이력이 없으면 접근 차단
  if (isInstitutionViewer && appliedPositions.length === 0) {
    return (
      <div className="max-w-[800px] mx-auto px-4 py-16 text-center">
        <Icon name="user" size={40} className="text-muted mx-auto mb-3" />
        <p className="text-sm text-muted">접근 권한이 없습니다</p>
        <p className="text-xs text-muted mt-1">해당 교사가 귀 기관 공고에 지원한 경우에만 이력서를 확인할 수 있습니다</p>
      </div>
    );
  }

  const age = calcAge(resume.birth_date);
  const exps = (resume.experiences || []) as Exp[];
  const certs = (resume.certificates || []) as { name: string; issuer?: string }[];

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      {/* 상단 액션 — 인쇄 시 숨김 */}
      <div className="no-print mb-4">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1 text-xs text-muted hover:text-[#4EA85E] mb-3">
          <Icon name="arrow-left" size={14} />
          <span>뒤로</span>
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-foreground">이력서</h1>
          <div className="flex flex-wrap gap-2">
            {isOwner && (
              <Link href="/resume/edit" className="px-3 py-2 text-xs font-semibold border border-[#4EA85E] text-[#4EA85E] rounded-lg hover:bg-[#EAF5EC]">
                수정하기
              </Link>
            )}
            <button onClick={handleDownloadPDF} className="px-3 py-2 text-xs font-semibold bg-[#4EA85E] text-white rounded-lg hover:bg-[#3d8b4c] flex items-center gap-1.5">
              <Icon name="pencil" size={13} /> PDF 다운로드
            </button>
            <button onClick={handlePrint} className="px-3 py-2 text-xs font-semibold border border-border text-foreground rounded-lg hover:bg-[#F7FAF6] flex items-center gap-1.5">
              <Icon name="pencil" size={13} /> 인쇄
            </button>
          </div>
        </div>
      </div>

      {/* 이력서 본문 — PDF와 동일 구조. 모바일에선 뷰포트에 맞춰 축소 */}
      <div ref={scaleWrapperRef} className="resume-scale-wrapper" style={{ height: innerHeight !== null && scale < 1 ? innerHeight * scale : undefined, overflow: scale < 1 ? 'hidden' : undefined }}>
      <div ref={resumeRef} className="border border-[#ccc] shadow-sm print-resume" style={{ width: RESUME_WIDTH, padding: '40px 36px', fontFamily: "'Pretendard Variable', sans-serif", background: '#ffffff', color: '#1F2B1F', transform: scale < 1 ? `scale(${scale})` : undefined, transformOrigin: 'top left' }}>

        {/* 워터마크 — 좌상단 뱃지 (화면/PDF/인쇄 공통) */}
        <div className="resume-watermark-badge" aria-hidden="true">
          <img src="/logo1_gyo.png" alt="" />
          <span>교집합</span>
        </div>
        {/* 워터마크 — 가운데 큰 옅은 배경 (화면/PDF/인쇄 공통) */}
        <div className="resume-watermark-bg" aria-hidden="true">
          <img src="/logo1_gyo.png" alt="" />
          <span>교집합</span>
        </div>

        {/* 지원분야 — 기관이 자기 공고로 지원받은 경우에만 노출. PDF/인쇄에도 함께 찍힘. */}
        {appliedPositions.length > 0 && (
          <p className="mb-2 text-[12px]" style={{ color: '#1F2B1F' }}>
            <span style={{ color: '#666' }}>지원분야: </span>
            <span style={{ fontWeight: 600 }}>{appliedPositions.join(', ')}</span>
          </p>
        )}

        {/* 제목 */}
        <h2 className="text-center text-[22px] font-bold tracking-[6px] pb-3 mb-6" style={{ color: '#1F2B1F', borderBottom: '2px solid #1F2B1F' }}>이 력 서</h2>

        {/* 인적사항 테이블 */}
        <div className="flex gap-5 mb-6">
          {/* 사진 */}
          <div className="w-[110px] h-[140px] border border-[#ccc] flex-shrink-0 flex items-center justify-center bg-[#fafafa] overflow-hidden">
            {resume.photo_url ? (
              <img src={resume.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[11px]" style={{ color: '#999' }}>사진</span>
            )}
          </div>

          {/* 정보 테이블 */}
          <table className="flex-1 border-collapse text-[12px]" style={{ borderTop: '2px solid #222' }}>
            <tbody>
              <Row label="성명" value={resume.name} label2="생년월일" value2={`${formatBirth(resume.birth_date)} (만 ${age}세)`} />
              <Row label="연락처" value={resume.phone} label2="이메일" value2={email} />
              <Row label="주소" value={tp?.address || ''} colSpan />
              <Row label="졸업대학" value={resume.affiliation || ''} colSpan />
            </tbody>
          </table>
        </div>

        {/* 자격증 및 능력사항 */}
        {certs.length > 0 && (
          <Section title="자격증 및 능력사항">
            <table className="w-full border-collapse text-[12px]" style={{ borderTop: '2px solid #222' }}>
              <thead>
                <tr className="bg-[#f5f5f5]">
                  <Th>자격증명</Th>
                  <Th>발행기관</Th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c, i) => (
                  <tr key={i}>
                    <Td>{c.name}</Td>
                    <Td>{c.issuer || '-'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        )}

        {/* 경력사항 */}
        {exps.length > 0 && (
          <Section title="경력사항">
            <table className="w-full border-collapse text-[12px]" style={{ borderTop: '2px solid #222' }}>
              <thead>
                <tr className="bg-[#f5f5f5]">
                  <Th>근무기관</Th>
                  <Th>기간</Th>
                  <Th>직무</Th>
                  <Th>담당연령</Th>
                </tr>
              </thead>
              <tbody>
                {exps.map((exp, i) => {
                  const period = exp.startDate
                    ? `${exp.startDate} ~ ${exp.isCurrent ? '재직중' : exp.endDate || ''}`
                    : exp.period || '';
                  return (
                    <tr key={i}>
                      <Td>{exp.institution}</Td>
                      <Td>{period}</Td>
                      <Td>{exp.role}</Td>
                      <Td>{exp.age_group}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Section>
        )}

        {/* 자기소개 */}
        {resume.introduction && (
          <Section title="자기소개">
            <p className="text-[12px] leading-[1.8] whitespace-pre-wrap" style={{ color: '#333' }}>{resume.introduction}</p>
          </Section>
        )}

        {/* 추가 안내 내용 */}
        {resume.portfolio && (
          <Section title="추가 안내 내용">
            <p className="text-[12px] leading-[1.8] whitespace-pre-wrap" style={{ color: '#333' }}>{resume.portfolio}</p>
          </Section>
        )}

        {/* 하단 날짜 */}
        <p className="mt-8 text-right text-[12px]" style={{ color: '#999' }}>
          {new Date().getFullYear()}년 {String(new Date().getMonth() + 1).padStart(2, '0')}월 {String(new Date().getDate()).padStart(2, '0')}일 작성
        </p>
      </div>
      </div>

      {/* 하단 인재 정보 목록으로 버튼 — 기관 로그인 시에만, 인쇄 시 숨김 */}
      {isInstitutionViewer && (
        <button
          onClick={() => router.back()}
          style={{ maxWidth: RESUME_WIDTH }}
          className="no-print flex items-center justify-center gap-2 w-full py-4 mt-4 bg-white border-2 border-[#B5CFB9] text-foreground/80 font-semibold rounded-xl hover:bg-[#EAF5EC] hover:text-[#4EA85E] hover:border-[#4EA85E] transition-colors text-sm"
        >
          <Icon name="arrow-left" size={16} />
          <span>인재 정보 목록으로</span>
        </button>
      )}

      {/* 하단 마이페이지로 버튼 — 본인(교사)일 때만, 인쇄 시 숨김 */}
      {isOwner && (
        <Link
          href="/mypage"
          style={{ maxWidth: RESUME_WIDTH }}
          className="no-print flex items-center justify-center gap-2 w-full py-4 mt-4 bg-white border-2 border-[#B5CFB9] text-foreground/80 font-semibold rounded-xl hover:bg-[#EAF5EC] hover:text-[#4EA85E] hover:border-[#4EA85E] transition-colors text-sm"
        >
          <Icon name="arrow-left" size={16} />
          <span>마이페이지로</span>
        </Link>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[13px] font-bold mb-2" style={{ color: '#1F2B1F' }}>{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value, label2, value2, colSpan }: { label: string; value: string; label2?: string; value2?: string; colSpan?: boolean }) {
  const cellStyle: React.CSSProperties = { border: '1px solid #ddd', padding: '8px 12px', color: '#1F2B1F' };
  const labelStyle: React.CSSProperties = { ...cellStyle, background: '#f9f9f9', fontWeight: 600, color: '#555', width: 80, textAlign: 'center' as const };
  if (colSpan) {
    return (
      <tr>
        <td style={labelStyle}>{label}</td>
        <td style={cellStyle} colSpan={3}>{value}</td>
      </tr>
    );
  }
  return (
    <tr>
      <td style={labelStyle}>{label}</td>
      <td style={cellStyle}>{value}</td>
      <td style={labelStyle}>{label2}</td>
      <td style={cellStyle}>{value2}</td>
    </tr>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ border: '1px solid #ddd', padding: '8px 12px', fontWeight: 600, color: '#555', textAlign: 'center', background: '#f5f5f5' }}>{children}</th>;
}

function Td({ children, rowSpan }: { children: React.ReactNode; rowSpan?: number }) {
  return <td style={{ border: '1px solid #ddd', padding: '8px 12px', textAlign: 'center', verticalAlign: 'middle', color: '#1F2B1F' }} rowSpan={rowSpan}>{children}</td>;
}
