'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPhone, formatDate, dateToISO, dateFromISO } from '@/lib/format';
import Icon from '@/components/Icon';
import PhotoUpload from '@/components/PhotoUpload';
import { PageSpinner, ButtonSpinner } from '@/components/Spinner';
import type { Resume } from '@/types/database';
import { useToast } from '@/components/Toast';

interface Certificate { name: string; issuer: string }
interface Experience { institution: string; startDate: string; endDate: string; isCurrent: boolean; role: string; age_group: string; description: string }

const roleOptions = ['담임교사', '부담임교사', '보조교사', '원감', '방과후교사', '특별활동강사'];
const ageGroupOptions = ['만3세', '만4세', '만5세', '혼합연령', '무관'];

export default function ResumeEdit() {
  const router = useRouter();
  const { user, profile, teacherProfile, loading: authLoading, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingId, setExistingId] = useState<string | null>(null);
  const resumeRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [university, setUniversity] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [certificates, setCertificates] = useState<Certificate[]>([{ name: '', issuer: '' }]);
  const [introduction, setIntroduction] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([]);

  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && (!user || profile?.user_type !== 'teacher')) {
      router.push('/login');
    }
  }, [authLoading, user, profile, router]);

  useEffect(() => {
    if (!user || authLoading) return;

    if (teacherProfile) {
      setName(teacherProfile.name);
      setBirthDate(dateFromISO(teacherProfile.birth_date));
      setPhone(teacherProfile.phone);
      setAddress(teacherProfile.address);
      setUniversity(teacherProfile.university || '');
      setPhotoUrl(teacherProfile.photo_url || null);
      if (Array.isArray(teacherProfile.certificates) && teacherProfile.certificates.length > 0) {
        setCertificates(teacherProfile.certificates);
      }
    }
    if (profile) setEmail(profile.email);

    supabase
      .from('resumes')
      .select('*')
      .eq('teacher_id', user.id)
      .single()
      .then(({ data }: { data: Resume | null }) => {
        if (data) {
          setExistingId(data.id);
          setName(data.name);
          setBirthDate(dateFromISO(data.birth_date));
          setPhone(data.phone);
          setPhotoUrl(data.photo_url || null);
          setIntroduction(data.introduction || '');
          setPortfolio(data.portfolio || '');
          if (Array.isArray(data.certificates) && data.certificates.length > 0) setCertificates(data.certificates as Certificate[]);
          if (Array.isArray(data.experiences) && data.experiences.length > 0) {
            setExperiences((data.experiences as Record<string, string | boolean>[]).map((exp) => ({
              institution: (exp.institution as string) || '',
              startDate: (exp.startDate as string) || (exp.period as string)?.split('~')[0]?.trim() || '',
              endDate: (exp.endDate as string) || (exp.period as string)?.split('~')[1]?.trim() || '',
              isCurrent: (exp.isCurrent as boolean) || false,
              role: (exp.role as string) || '담임교사',
              age_group: (exp.age_group as string) || '무관',
              description: (exp.description as string) || '',
            })));
          }
          if (data.affiliation) setUniversity(data.affiliation);
        }
        setLoading(false);
      });
  }, [user, authLoading, teacherProfile, profile, supabase]);

  const setCert = (i: number, key: keyof Certificate, val: string) =>
    setCertificates((prev) => prev.map((c, j) => (j === i ? { ...c, [key]: val } : c)));
  const addCert = () => setCertificates((prev) => [...prev, { name: '', issuer: '' }]);
  const removeCert = (i: number) => setCertificates((prev) => prev.filter((_, j) => j !== i));

  const setExp = (i: number, key: keyof Experience, val: string | boolean) =>
    setExperiences((prev) => prev.map((e, j) => (j === i ? { ...e, [key]: val } : e)));
  const addExp = () => setExperiences((prev) => [...prev, { institution: '', startDate: '', endDate: '', isCurrent: false, role: '담임교사', age_group: '무관', description: '' }]);
  const removeExp = (i: number) => setExperiences((prev) => prev.filter((_, j) => j !== i));

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const payload = {
      teacher_id: user.id,
      name,
      birth_date: dateToISO(birthDate),
      phone,
      affiliation: university || null,
      introduction,
      portfolio: portfolio || null,
      certificates: certificates.filter((c) => c.name.trim()),
      experiences,
      photo_url: photoUrl,
    };

    if (existingId) {
      await supabase.from('resumes').update(payload).eq('id', existingId);
    } else {
      const { data } = await supabase.from('resumes').insert(payload).select('id').single();
      if (data) setExistingId(data.id);
    }

    await refreshProfile();
    setSaving(false);
    toast('이력서가 저장되었습니다');
    router.push('/mypage');
  };

  const handleDownloadPDF = async () => {
    if (!resumeRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const { jsPDF } = await import('jspdf');

    const clone = resumeRef.current.cloneNode(true) as HTMLElement;
    clone.style.position = 'fixed';
    clone.style.left = '0';
    clone.style.top = '0';
    clone.style.width = '800px';
    clone.style.zIndex = '-9999';
    clone.style.background = '#ffffff';
    document.body.appendChild(clone);

    const canvas = await html2canvas(clone, { scale: 2, useCORS: true, backgroundColor: '#ffffff', scrollY: 0, scrollX: 0, windowWidth: 800 });
    document.body.removeChild(clone);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfW = pdf.internal.pageSize.getWidth();
    const pdfH = (canvas.height * pdfW) / canvas.width;
    const pageH = pdf.internal.pageSize.getHeight();

    if (pdfH <= pageH) {
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    } else {
      let offset = 0;
      while (offset < pdfH) {
        if (offset > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, -offset, pdfW, pdfH);
        offset += pageH;
      }
    }

    pdf.save(`이력서_${name}.pdf`);
  };

  const calcAge = (bd: string) => {
    const iso = dateToISO(bd);
    if (iso.length < 10) return '';
    const born = new Date(iso);
    const now = new Date();
    let age = now.getFullYear() - born.getFullYear();
    if (now.getMonth() < born.getMonth() || (now.getMonth() === born.getMonth() && now.getDate() < born.getDate())) age--;
    return `만 ${age}세`;
  };

  if (authLoading || loading) return <PageSpinner />;

  return (
    <div className="max-w-[800px] mx-auto px-4 py-8">
      {/* 상단 타이틀 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground">{existingId ? '이력서 수정' : '이력서 작성'}</h1>
          <p className="text-xs text-muted mt-0.5">회원가입 정보가 자동으로 입력됩니다</p>
        </div>
        {existingId && (
          <button onClick={handleDownloadPDF} className="flex items-center gap-1 px-3 py-2 text-xs font-semibold border border-[#4EA85E] text-[#4EA85E] rounded-lg hover:bg-[#EAF5EC]">
            <Icon name="pencil" size={14} /> PDF 다운로드
          </button>
        )}
      </div>

      {/* 이력서 본문 */}
      <div ref={resumeRef} className="bg-white rounded-2xl border border-[#E3EADF] overflow-hidden">

        {/* 사진 + 기본 인적사항 — 이력서 상단 */}
        <div className="p-6 border-b border-[#E3EADF]">
          <h2 className="text-sm font-bold text-[#4EA85E] mb-4 flex items-center gap-1.5">
            <Icon name="user" size={16} /> 인적사항
          </h2>
          <div className="flex gap-6">
            {/* 증명사진 */}
            <div className="flex-shrink-0 w-[130px]">
              <div className="w-[130px] h-[160px] rounded-lg border border-border bg-[#F7FAF6] overflow-hidden mb-2 flex items-center justify-center">
                {photoUrl ? (
                  <img src={photoUrl} alt="증명사진" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-muted">
                    <Icon name="user" size={32} className="mx-auto mb-1 opacity-30" />
                    <p className="text-[10px]">증명사진</p>
                  </div>
                )}
              </div>
              <PhotoUpload
                label="사진 등록"
                iconName="user"
                bucket="avatars"
                folder={user?.id || 'tmp'}
                existingUrls={photoUrl ? [photoUrl] : []}
                onUploaded={(urls) => setPhotoUrl(urls[0] || null)}
              />
            </div>

            {/* 기본정보 */}
            <div className="flex-1 grid grid-cols-2 gap-x-4 gap-y-3 content-start">
              <Field label="이름">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input-field" />
              </Field>
              <Field label="생년월일">
                <div className="flex gap-2">
                  <input type="text" value={birthDate} onChange={(e) => setBirthDate(formatDate(e.target.value))} placeholder="1990/01/15" maxLength={10} className="input-field flex-1" />
                  {birthDate.length === 10 && (
                    <span className="text-xs text-muted bg-[#F7FAF6] border border-border rounded-lg px-2 h-[42px] flex items-center flex-shrink-0">{calcAge(birthDate)}</span>
                  )}
                </div>
              </Field>
              <Field label="전화번호">
                <input type="tel" value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} className="input-field" />
              </Field>
              <Field label="이메일">
                <input type="email" value={email} readOnly className="input-field bg-gray-50 text-muted" />
              </Field>
              <Field label="주소">
                <input type="text" value={address} readOnly className="input-field bg-gray-50 text-muted" />
              </Field>
              <Field label="졸업 대학교">
                <input type="text" value={university} onChange={(e) => setUniversity(e.target.value)} placeholder="OO대학교 유아교육과" className="input-field" />
              </Field>
            </div>
          </div>
        </div>

        {/* 소유 자격 */}
        <div className="p-6 border-b border-[#E3EADF]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#4EA85E] flex items-center gap-1.5">
              <Icon name="check" size={16} /> 소유 자격
            </h2>
            <button type="button" onClick={addCert} className="text-xs font-semibold bg-[#EAF5EC] text-[#4EA85E] px-3 py-1.5 rounded-full hover:bg-[#A5D6A7]/40">
              + 자격 추가
            </button>
          </div>
          <div className="space-y-2">
            {certificates.map((cert, i) => (
              <div key={i} className="flex gap-3 items-center">
                <input type="text" value={cert.name} onChange={(e) => setCert(i, 'name', e.target.value)} placeholder="자격증명 (예: 유치원정교사2급)" className="input-field flex-1 min-w-0" />
                <input type="text" value={cert.issuer} onChange={(e) => setCert(i, 'issuer', e.target.value)} placeholder="발급기관 (예: 교육부)" className="input-field flex-1 min-w-0" />
                {certificates.length > 1 && (
                  <button type="button" onClick={() => removeCert(i)} className="px-2 text-muted hover:text-danger text-sm flex-shrink-0">x</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 경력사항 */}
        <div className="p-6 border-b border-[#E3EADF]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-[#4EA85E] flex items-center gap-1.5">
              <Icon name="bookmark" size={16} /> 경력사항
            </h2>
            <button type="button" onClick={addExp} className="text-xs font-semibold bg-[#EAF5EC] text-[#4EA85E] px-3 py-1.5 rounded-full hover:bg-[#A5D6A7]/40">
              + 경력 추가
            </button>
          </div>
          {experiences.length === 0 ? (
            <div className="text-center py-10 bg-[#F7FAF6] rounded-xl border border-dashed border-[#E3EADF]">
              <Icon name="building" size={28} className="mx-auto text-muted/30 mb-2" />
              <p className="text-sm text-muted">등록된 경력이 없습니다</p>
              <button type="button" onClick={addExp} className="mt-2 text-xs font-semibold text-[#4EA85E] hover:underline">첫 경력 추가하기</button>
            </div>
          ) : (
            <div className="space-y-3">
              {experiences.map((exp, i) => (
                <div key={i} className="bg-[#F7FAF6] rounded-xl p-4 border border-[#E3EADF] relative">
                  <button type="button" onClick={() => removeExp(i)} className="absolute top-3 right-3 text-muted hover:text-danger text-xs">삭제</button>
                  {/* 기관명 | 시작 ~ 종료 | 재직중 — 한줄 */}
                  <div className="flex items-end gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      <Field label="기관명">
                        <input type="text" value={exp.institution} onChange={(e) => setExp(i, 'institution', e.target.value)} placeholder="햇살유치원" className="input-field" />
                      </Field>
                    </div>
                    <div className="w-[120px] flex-shrink-0">
                      <Field label="시작">
                        <MonthInput value={exp.startDate} onChange={(v) => setExp(i, 'startDate', v)} />
                      </Field>
                    </div>
                    <span className="text-muted text-xs pb-2.5">~</span>
                    <div className="w-[120px] flex-shrink-0">
                      <Field label="종료">
                        {exp.isCurrent ? (
                          <div className="input-field flex items-center justify-center text-[#4EA85E] font-semibold text-xs">재직중</div>
                        ) : (
                          <MonthInput value={exp.endDate} onChange={(v) => setExp(i, 'endDate', v)} />
                        )}
                      </Field>
                    </div>
                    <label className="flex items-center gap-1 cursor-pointer pb-2 flex-shrink-0">
                      <input type="checkbox" checked={exp.isCurrent} onChange={(e) => {
                        const updated = [...experiences];
                        updated[i] = { ...updated[i], isCurrent: e.target.checked, endDate: e.target.checked ? '' : updated[i].endDate };
                        setExperiences(updated);
                      }} className="accent-[#66c477]" />
                      <span className="text-[11px] text-foreground whitespace-nowrap">재직중</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <Field label="직무">
                      <select value={exp.role} onChange={(e) => setExp(i, 'role', e.target.value)} className="input-field">
                        {roleOptions.map((r) => <option key={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label="담당 연령">
                      <select value={exp.age_group} onChange={(e) => setExp(i, 'age_group', e.target.value)} className="input-field">
                        {ageGroupOptions.map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </Field>
                  </div>
                  <Field label="업무 내용 (선택)">
                    <textarea
                      value={exp.description}
                      onChange={(e) => setExp(i, 'description', e.target.value)}
                      placeholder="담당했던 주요 업무, 프로그램 운영, 성과 등을 간략히 작성해주세요."
                      className="input-field min-h-[60px]"
                    />
                  </Field>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 자기소개 */}
        <div className="p-6 border-b border-[#E3EADF]">
          <h2 className="text-sm font-bold text-[#4EA85E] mb-3 flex items-center gap-1.5">
            <Icon name="pencil" size={16} /> 자기소개
          </h2>
          <textarea
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            placeholder="교육 철학, 강점, 포부 등을 자유롭게 작성해주세요."
            className="input-field min-h-[160px]"
          />
        </div>

        {/* 포트폴리오/자기개발 */}
        <div className="p-6">
          <h2 className="text-sm font-bold text-[#4EA85E] mb-3 flex items-center gap-1.5">
            <Icon name="star" size={16} /> 포트폴리오 / 자기개발
          </h2>
          <textarea
            value={portfolio}
            onChange={(e) => setPortfolio(e.target.value)}
            placeholder="수상 경력, 연수 이수, 프로젝트 경험 등을 자유롭게 작성해주세요."
            className="input-field min-h-[120px]"
          />
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="sticky bottom-0 bg-background/90 backdrop-blur-sm pt-4 pb-6 mt-4 flex gap-3">
        <button onClick={handleSave} disabled={saving} className="flex-1 py-3 bg-[#66c477] hover:bg-[#4EA85E] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
          {saving ? <ButtonSpinner /> : '이력서 저장'}
        </button>
        {existingId && (
          <button onClick={handleDownloadPDF} className="px-6 py-3 border border-[#4EA85E] text-[#4EA85E] font-semibold rounded-xl hover:bg-[#EAF5EC]">
            PDF
          </button>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-foreground/70 mb-0.5 block">{label}</span>
      {children}
    </label>
  );
}

function formatMonth(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 6);
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}/${digits.slice(4)}`;
}

function MonthInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const monthRef = useRef<HTMLInputElement>(null);
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(formatMonth(e.target.value))}
        placeholder="2022/03"
        maxLength={7}
        className="input-field" style={{ paddingRight: 36 }}
      />
      <button
        type="button"
        onClick={() => monthRef.current?.showPicker()}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#EAF5EC] transition-colors"
      >
        <Icon name="clock" size={14} className="text-muted" />
      </button>
      <input
        ref={monthRef}
        type="month"
        className="sr-only"
        onChange={(e) => {
          if (e.target.value) onChange(e.target.value.replace(/-/g, '/'));
        }}
      />
    </div>
  );
}
