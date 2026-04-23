'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
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

export default function ResumeViewPage() {
  const params = useParams();
  const teacherId = params.id as string;
  const { user } = useAuth();
  const supabase = createClient();
  const resumeRef = React.useRef<HTMLDivElement>(null);

  const [resume, setResume] = useState<Resume | null>(null);
  const [tp, setTp] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const isOwner = user?.id === teacherId;

  useEffect(() => {
    Promise.all([
      supabase.from('resumes').select('*').eq('teacher_id', teacherId).single(),
      supabase.from('teacher_profiles').select('*').eq('id', teacherId).single(),
    ]).then(([r, p]) => {
      setResume(r.data);
      setTp(p.data);
      setLoading(false);
    });
  }, [teacherId, supabase]);

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    const { generateResumePdf } = await import('@/lib/resumePdf');
    await generateResumePdf(resumeRef.current, `이력서_${resume?.name || ''}.pdf`);
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

  const age = calcAge(resume.birth_date);
  const exps = (resume.experiences || []) as Exp[];
  const certs = (resume.certificates || []) as { name: string; needs_reentry?: boolean }[];

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      {/* 상단 액션 — 인쇄 시 숨김 */}
      <div className="flex items-center justify-between mb-4 no-print">
        <h1 className="text-lg font-bold text-foreground">이력서</h1>
        <div className="flex gap-2">
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

      {/* 이력서 본문 — PDF와 동일 구조. html2canvas 호환을 위해 인라인 색상 사용 */}
      <div ref={resumeRef} className="border border-[#ccc] shadow-sm print-resume" style={{ padding: '40px 36px', fontFamily: "'Pretendard Variable', sans-serif", background: '#ffffff', color: '#1F2B1F' }}>

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
              <Row label="연락처" value={resume.phone} label2="이메일" value2={tp?.address ? '' : ''} />
              <Row label="주소" value={tp?.address || ''} colSpan />
              <Row label="졸업대학" value={resume.affiliation || ''} colSpan />
            </tbody>
          </table>
        </div>

        {/* 소유 자격 */}
        {certs.length > 0 && (
          <Section title="소유 자격">
            <table className="w-full border-collapse text-[12px]" style={{ borderTop: '2px solid #222' }}>
              <thead>
                <tr className="bg-[#f5f5f5]">
                  <Th>자격증명</Th>
                </tr>
              </thead>
              <tbody>
                {certs.map((c, i) => (
                  <tr key={i}>
                    <Td>{c.name}</Td>
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

        {/* 포트폴리오 */}
        {resume.portfolio && (
          <Section title="포트폴리오 / 자기개발">
            <p className="text-[12px] leading-[1.8] whitespace-pre-wrap" style={{ color: '#333' }}>{resume.portfolio}</p>
          </Section>
        )}

        {/* 하단 날짜 */}
        <p className="mt-8 text-right text-[12px]" style={{ color: '#999' }}>
          {new Date().getFullYear()}년 {String(new Date().getMonth() + 1).padStart(2, '0')}월 {String(new Date().getDate()).padStart(2, '0')}일 작성
        </p>
      </div>
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
