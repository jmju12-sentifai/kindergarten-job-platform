'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { formatPhone, formatDate, dateToISO, dateFromISO, formatBusinessNumber } from '@/lib/format';
import Icon from '@/components/Icon';
import PhotoUpload from '@/components/PhotoUpload';
import AddressSearch from '@/components/AddressSearch';
import { PageSpinner, ButtonSpinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { CERTIFICATES, CERT_OTHER, isFixedCertificate } from '@/constants/certificates';

export default function EditProfile() {
  const router = useRouter();
  const { user, profile, teacherProfile, institutionProfile, loading: authLoading, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // 구직자 폼
  const [tForm, setTForm] = useState({
    name: '', birthDate: '', address: '', phone: '', university: '', photoUrl: null as string | null,
  });
  const [certificates, setCertificates] = useState<{ name: string; needs_reentry?: boolean }[]>([{ name: '' }]);

  // 기관 폼
  const [iForm, setIForm] = useState({
    name: '', type: '사립(개인)', address: '', phone: '', businessNumber: '',
    directorName: '', nearbyStations: ['', ''], classCount: '',
    description: '', photoUrls: [] as string[],
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/login'); return; }

    if (teacherProfile) {
      setTForm({
        name: teacherProfile.name,
        birthDate: dateFromISO(teacherProfile.birth_date),
        address: teacherProfile.address,
        phone: teacherProfile.phone,
        university: teacherProfile.university || '',
        photoUrl: teacherProfile.photo_url || null,
      });
      if (Array.isArray(teacherProfile.certificates) && teacherProfile.certificates.length > 0) {
        setCertificates(teacherProfile.certificates);
      }
    }

    if (institutionProfile) {
      const ip = institutionProfile;
      setIForm({
        name: ip.name,
        type: ip.type,
        address: ip.address,
        phone: ip.phone,
        businessNumber: ip.business_number,
        directorName: ip.director_name,
        nearbyStations: [
          ...(ip.nearby_stations || []),
          '', '',
        ].slice(0, 2),
        classCount: ip.class_count?.toString() || '',
        description: ip.description || '',
        photoUrls: ip.photos || [],
      });
    }
  }, [authLoading, user, teacherProfile, institutionProfile, router]);

  const isTeacher = profile?.user_type === 'teacher';

  const handleSaveTeacher = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();

    await supabase.from('teacher_profiles').update({
      name: tForm.name,
      birth_date: dateToISO(tForm.birthDate),
      address: tForm.address,
      phone: tForm.phone,
      university: tForm.university || null,
      photo_url: tForm.photoUrl,
      certificates: certificates.filter((c) => c.name.trim()),
    }).eq('id', user.id);

    await refreshProfile();
    setSaving(false);
    toast('정보가 수정되었습니다');
    router.push('/mypage');
  };

  const handleSaveInstitution = async () => {
    if (!user) return;
    setSaving(true);
    const supabase = createClient();
    const parts = iForm.address.split(' ');
    const region = parts[0] || '';
    const sigungu = parts[1] || '';
    const gu = (parts[2] && /(구|군)$/.test(parts[2])) ? parts[2] : null;
    const shortParts = [region, sigungu, gu].filter(Boolean);

    await supabase.from('institution_profiles').update({
      name: iForm.name,
      type: iForm.type,
      address: iForm.address,
      address_short: shortParts.join(' '),
      address_region: region || null,
      address_sigungu: sigungu || null,
      address_gu: gu,
      phone: iForm.phone,
      business_number: iForm.businessNumber,
      director_name: iForm.directorName,
      nearby_stations: iForm.nearbyStations.filter(Boolean),
      class_count: iForm.classCount ? parseInt(iForm.classCount) : null,
      description: iForm.description || null,
      photos: iForm.photoUrls,
    }).eq('id', user.id);

    await refreshProfile();
    setSaving(false);
    toast('정보가 수정되었습니다');
    router.push('/mypage');
  };

  if (authLoading) return <PageSpinner />;

  const setT = (key: string, val: string) => setTForm((f) => ({ ...f, [key]: val }));
  const setI = (key: string, val: string) => setIForm((f) => ({ ...f, [key]: val }));
  const setStation = (idx: number, val: string) => {
    setIForm((f) => {
      const s = [...f.nearbyStations]; s[idx] = val; return { ...f, nearbyStations: s };
    });
  };
  const setCertName = (i: number, val: string) =>
    setCertificates((prev) => prev.map((c, j) => (j === i ? { name: val } : c)));

  return (
    <div className="max-w-[520px] mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <button onClick={() => router.back()} className="text-muted hover:text-foreground">
          <Icon name="leaf" size={18} />
        </button>
        <h1 className="text-xl font-bold text-foreground">내 정보 수정</h1>
      </div>

      {isTeacher ? (
        <div className="space-y-4">
          {/* 사진 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E3EADF]">
            <div className="flex items-center gap-4">
              <div className="w-[80px] h-[100px] rounded-lg border border-border bg-[#F7FAF6] overflow-hidden flex items-center justify-center flex-shrink-0">
                {tForm.photoUrl ? (
                  <img src={tForm.photoUrl} alt="프로필" className="w-full h-full object-cover" />
                ) : (
                  <Icon name="user" size={28} className="text-muted/30" />
                )}
              </div>
              <div className="flex-1">
                <PhotoUpload label="사진 변경" iconName="user" bucket="avatars" folder={user?.id || 'tmp'}
                  existingUrls={tForm.photoUrl ? [tForm.photoUrl] : []}
                  onUploaded={(urls) => setTForm((f) => ({ ...f, photoUrl: urls[0] || null }))} />
              </div>
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E3EADF] space-y-4">
            <h3 className="text-sm font-bold text-foreground">기본 정보</h3>
            <Field label="이름">
              <input type="text" value={tForm.name} onChange={(e) => setT('name', e.target.value)} className="input-field" />
            </Field>
            <Field label="생년월일">
              <input type="text" value={tForm.birthDate} onChange={(e) => setT('birthDate', formatDate(e.target.value))} placeholder="1990/01/15" maxLength={10} className="input-field" />
            </Field>
            <Field label="주소">
              <AddressSearch value={tForm.address} onChange={(v) => setT('address', v)} />
            </Field>
            <Field label="전화번호">
              <input type="tel" value={tForm.phone} onChange={(e) => setT('phone', formatPhone(e.target.value))} className="input-field" />
            </Field>
            <Field label="졸업 대학교">
              <input type="text" value={tForm.university} onChange={(e) => setT('university', e.target.value)} placeholder="OO대학교 유아교육과" className="input-field" />
            </Field>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-foreground">소유 자격</span>
                <button type="button" onClick={() => setCertificates((p) => [...p, { name: '' }])} className="text-[11px] font-semibold text-[#4EA85E]">+ 추가</button>
              </div>
              {certificates.map((cert, i) => {
                const isOther = cert.name !== '' && !isFixedCertificate(cert.name);
                const selectValue = cert.name === '' ? '' : isOther ? CERT_OTHER : cert.name;
                return (
                <div key={i} className="space-y-2 mb-2">
                  <div className="flex gap-2">
                    <select
                      value={selectValue}
                      onChange={(e) => {
                        if (e.target.value === CERT_OTHER) setCertName(i, ' ');
                        else setCertName(i, e.target.value);
                      }}
                      className="input-field flex-1 min-w-0"
                    >
                      <option value="">자격증 선택</option>
                      {CERTIFICATES.map((c) => <option key={c} value={c}>{c}</option>)}
                      <option value={CERT_OTHER}>{CERT_OTHER}</option>
                    </select>
                    {certificates.length > 1 && (
                      <button type="button" onClick={() => setCertificates((p) => p.filter((_, j) => j !== i))} className="px-2 text-muted hover:text-danger text-sm flex-shrink-0">x</button>
                    )}
                  </div>
                  {isOther && (
                    <input
                      type="text"
                      value={cert.name.trim() === '' ? '' : cert.name}
                      onChange={(e) => setCertName(i, e.target.value)}
                      placeholder="직접 입력 (예: 놀이교육지도사)"
                      className="input-field w-full"
                      autoFocus
                    />
                  )}
                </div>
                );
              })}
            </div>
          </div>

          <button onClick={handleSaveTeacher} disabled={saving} className="w-full py-3 bg-[#66c477] hover:bg-[#4EA85E] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <ButtonSpinner /> : '저장'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-[#E3EADF] space-y-4">
            <h3 className="text-sm font-bold text-foreground">기관 정보</h3>
            <Field label="기관명">
              <input type="text" value={iForm.name} onChange={(e) => setI('name', e.target.value)} className="input-field" />
            </Field>
            <Field label="설립유형">
              <select value={iForm.type} onChange={(e) => setI('type', e.target.value)} className="input-field">
                {['국공립(단설)', '국공립(병설)', '사립(개인)', '사립(법인)', '사립(종교)'].map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="원장 성함">
              <input type="text" value={iForm.directorName} onChange={(e) => setI('directorName', e.target.value)} className="input-field" />
            </Field>
            <Field label="주소">
              <AddressSearch value={iForm.address} onChange={(v) => setI('address', v)} />
            </Field>
            <Field label="전화번호">
              <input type="tel" value={iForm.phone} onChange={(e) => setI('phone', formatPhone(e.target.value))} className="input-field" />
            </Field>
            <Field label="사업자번호">
              <input type="text" value={iForm.businessNumber} onChange={(e) => setI('businessNumber', formatBusinessNumber(e.target.value))} className="input-field" />
            </Field>
            <Field label="가까운 역 (최대 2개)">
              <div className="flex gap-2">
                <input type="text" value={iForm.nearbyStations[0]} onChange={(e) => setStation(0, e.target.value)} placeholder="예: 역삼역" className="input-field" />
                <input type="text" value={iForm.nearbyStations[1]} onChange={(e) => setStation(1, e.target.value)} placeholder="예: 강남역" className="input-field" />
              </div>
            </Field>
            <Field label="운영반 갯수">
              <input type="number" min="0" value={iForm.classCount} onChange={(e) => setI('classCount', e.target.value)} placeholder="예: 6" className="input-field" />
            </Field>
            <Field label="기관 소개">
              <textarea value={iForm.description} onChange={(e) => setI('description', e.target.value)} placeholder="기관을 소개해주세요" className="input-field min-h-[80px]" />
            </Field>
            <div>
              <span className="text-xs font-semibold text-foreground mb-1 block">전경 사진</span>
              <PhotoUpload label="기관 사진 변경" multiple iconName="home" bucket="photos" folder={user?.id || 'tmp'}
                existingUrls={iForm.photoUrls}
                onUploaded={(urls) => setIForm((f) => ({ ...f, photoUrls: urls }))} />
            </div>
          </div>

          <button onClick={handleSaveInstitution} disabled={saving} className="w-full py-3 bg-[#66c477] hover:bg-[#4EA85E] text-white font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <ButtonSpinner /> : '저장'}
          </button>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
