'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import { formatPhone, formatDate, dateToISO, formatBusinessNumber } from '@/lib/format';
import Icon from '@/components/Icon';
import PhotoUpload, { type PhotoUploadHandle } from '@/components/PhotoUpload';
import AddressSearch from '@/components/AddressSearch';
import { ButtonSpinner, PageSpinner } from '@/components/Spinner';
import { useToast } from '@/components/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { useFieldValidation } from '@/lib/useFieldValidation';
import FieldHint from '@/components/FieldHint';
import { PHOTO_GUIDANCE } from '@/constants/photoGuidance';

function InstitutionSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isKakao = searchParams.get('kakao') === '1';
  const errorParam = searchParams.get('error');
  const isAlreadyRegistered = errorParam === 'already_registered';
  const { toast } = useToast();
  const { user, refreshProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isKakao) return;
    if (authLoading) return;
    if (!user) {
      toast('카카오 로그인 세션이 만료되었습니다.', 'error');
      router.replace('/login');
    }
  }, [isKakao, authLoading, user, router, toast]);

  useEffect(() => {
    if (isAlreadyRegistered) {
      toast('이미 가입된 카카오 계정입니다. 로그인해주세요.', 'error');
    }
  }, [isAlreadyRegistered, toast]);
  const photoRef = useRef<PhotoUploadHandle>(null);
  const { emailStatus, passwordValid, passwordMatch, checkEmail, checkPassword, checkPasswordMatch } = useFieldValidation();
  const [form, setForm] = useState({
    name: '',
    type: '사립(개인)',
    address: '',
    phone: '',
    businessNumber: '',
    directorName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    nearbyStations: ['', ''],
    classCount: '',
    purpose: [] as string[],
  });

  const set = (key: string, val: string) => setForm((f) => ({ ...f, [key]: val }));
  const togglePurpose = (p: string) => {
    setForm((f) => ({
      ...f,
      purpose: f.purpose.includes(p) ? f.purpose.filter((x) => x !== p) : [...f.purpose, p],
    }));
  };
  const setStation = (idx: number, val: string) => {
    setForm((f) => {
      const stations = [...f.nearbyStations];
      stations[idx] = val;
      return { ...f, nearbyStations: stations };
    });
  };

  const handleKakao = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback?role=institution` },
    });
    if (error) toast('카카오 로그인을 시작할 수 없습니다.', 'error');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isKakao) {
      if (!form.email.trim()) { toast('이메일을 입력해주세요.', 'error'); return; }
      if (!form.email.includes('@')) { toast('올바른 이메일 형식을 입력해주세요.', 'error'); return; }
      if (emailStatus === 'taken') { toast('이미 사용 중인 이메일입니다.', 'error'); return; }
      if (!form.password) { toast('비밀번호를 입력해주세요.', 'error'); return; }
      if (form.password.length < 8) { toast('비밀번호는 8자 이상이어야 합니다.', 'error'); return; }
      if (form.password !== form.passwordConfirm) { toast('비밀번호가 일치하지 않습니다.', 'error'); return; }
    }
    if (!form.name.trim()) { toast('기관명을 입력해주세요.', 'error'); return; }
    if (!form.address.trim()) { toast('주소를 입력해주세요.', 'error'); return; }
    if (!form.phone.trim()) { toast('전화번호를 입력해주세요.', 'error'); return; }
    if (!form.businessNumber.trim()) { toast('사업자번호를 입력해주세요.', 'error'); return; }
    if (!form.directorName.trim()) { toast('원장 성함을 입력해주세요.', 'error'); return; }

    setLoading(true);
    const supabase = createClient();

    let userId: string | null = null;
    let accountEmail = form.email;
    if (isKakao) {
      if (!user || !user.email) { toast('세션이 만료되었습니다. 다시 로그인해주세요.', 'error'); setLoading(false); router.push('/login'); return; }
      userId = user.id;
      accountEmail = user.email;
    } else {
      const { data, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { user_type: 'institution' } },
      });
      if (authError) { toast(authError.message, 'error'); setLoading(false); return; }
      userId = data.user?.id ?? null;
    }

    if (userId) {
      // 사진 업로드 (가입 후 인증 상태에서)
      let uploadedPhotos: string[] = [];
      if (photoRef.current) {
        uploadedPhotos = await photoRef.current.uploadFiles('photos', userId);
      }

      const parts = form.address.split(' ');
      const region = parts[0] || '';
      const sigungu = parts[1] || '';
      const gu = (parts[2] && /(구|군)$/.test(parts[2])) ? parts[2] : null;
      const shortParts = [region, sigungu, gu].filter(Boolean);
      await supabase.from('institution_profiles').insert({
        id: userId,
        name: form.name,
        type: form.type,
        address: form.address,
        address_short: shortParts.join(' '),
        address_region: region || null,
        address_sigungu: sigungu || null,
        address_gu: gu,
        phone: form.phone,
        business_number: form.businessNumber,
        email: accountEmail,
        director_name: form.directorName,
        nearby_stations: form.nearbyStations.filter(Boolean),
        class_count: form.classCount ? parseInt(form.classCount) : null,
        photos: uploadedPhotos,
        purpose: form.purpose,
      });
    }

    await refreshProfile();
    setLoading(false);
    toast('회원가입이 완료되었습니다');
    router.push('/mypage');
  };

  return (
    <div className="min-h-[calc(100vh-120px)] px-4 py-12" style={{ background: 'linear-gradient(180deg, #EAF5EC 0%, #F7FAF6 300px)' }}>
      <div className="max-w-[520px] mx-auto">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 bg-[#EAF5EC] text-[#4EA85E] px-3 py-1 rounded-full text-xs font-semibold mb-3">
            <Icon name="building" size={14} /> 기관 회원가입
          </div>
          <h1 className="text-xl font-bold text-foreground">기관 계정 만들기</h1>
        </div>

        {isAlreadyRegistered && (
          <div className="bg-[#FDECEC] border border-[#F5BEBE] rounded-xl p-3 mb-4 text-xs text-[#B2342A]">
            이미 가입된 카카오 계정입니다. <Link href="/login" className="font-semibold underline">로그인 페이지로 이동</Link>
          </div>
        )}

        {!isKakao && (
          <>
            <button onClick={handleKakao} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm mb-4" style={{ background: '#FEE500', color: '#191919' }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 1C4.58 1 1 3.8 1 7.28c0 2.24 1.49 4.2 3.74 5.32l-.96 3.53a.3.3 0 0 0 .45.33L8.3 13.9c.23.02.46.03.7.03 4.42 0 8-2.8 8-6.28S13.42 1 9 1Z" fill="#191919"/></svg>
              카카오로 시작하기
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-border" /><span className="text-xs text-muted">또는 이메일로 가입</span><div className="flex-1 h-px bg-border" />
            </div>
          </>
        )}

        {isKakao && user?.email && (
          <div className="bg-[#FFFBE5] border border-[#F5DC47] rounded-xl p-3 mb-4 text-xs text-foreground">
            <b>{user.email}</b> 계정으로 연결됩니다. 아래 필수정보를 입력해주세요.
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {!isKakao && (
          <div className="bg-white rounded-2xl p-6 border border-[#E3EADF] space-y-4">
            <h3 className="text-sm font-bold text-foreground">계정 정보</h3>
            <p className="text-[11px] text-muted -mt-3">로그인 시 사용할 이메일과 비밀번호입니다</p>
            <Field label="이메일" required>
              <input type="email" value={form.email} onChange={(e) => { set('email', e.target.value); checkEmail(e.target.value); }} onBlur={() => checkEmail(form.email)} placeholder="example@kindergarten.kr" className="input-field" />
              <FieldHint
                status={emailStatus === 'idle' ? 'idle' : emailStatus === 'checking' ? 'checking' : emailStatus === 'available' ? 'valid' : 'invalid'}
                messages={{ checking: '중복 확인 중...', valid: '사용 가능한 이메일입니다.', invalid: emailStatus === 'taken' ? '이미 사용 중인 이메일입니다.' : '올바른 이메일 형식을 입력해주세요.' }}
              />
            </Field>
            <Field label="비밀번호" required>
              <input type="password" value={form.password} onChange={(e) => { set('password', e.target.value); checkPassword(e.target.value); checkPasswordMatch(e.target.value, form.passwordConfirm); }} placeholder="8자 이상" className="input-field" />
              {form.password.length > 0 && (
                <FieldHint status={passwordValid ? 'valid' : 'invalid'} messages={{ valid: '사용 가능한 비밀번호입니다.', invalid: '8자 이상 입력해주세요.' }} />
              )}
            </Field>
            <Field label="비밀번호 확인" required>
              <input type="password" value={form.passwordConfirm} onChange={(e) => { set('passwordConfirm', e.target.value); checkPasswordMatch(form.password, e.target.value); }} placeholder="비밀번호 재입력" className="input-field" />
              {form.passwordConfirm.length > 0 && (
                <FieldHint status={passwordMatch ? 'valid' : 'invalid'} messages={{ valid: '비밀번호가 일치합니다.', invalid: '비밀번호가 일치하지 않습니다.' }} />
              )}
            </Field>
          </div>
          )}

          {/* 기관 정보 */}
          <div className="bg-white rounded-2xl p-6 border border-[#E3EADF] space-y-4">
            <h3 className="text-sm font-bold text-foreground">기관 정보</h3>
            <Field label="기관명" required>
              <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="햇살유치원" className="input-field" />
            </Field>
            <Field label="설립유형" required>
              <select value={form.type} onChange={(e) => set('type', e.target.value)} className="input-field">
                {['국공립(단설)', '국공립(병설)', '사립(개인)', '사립(법인)', '사립(종교)'].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="원장 성함" required>
              <input type="text" value={form.directorName} onChange={(e) => set('directorName', e.target.value)} placeholder="대표자명" className="input-field" />
            </Field>
            <Field label="주소" required>
              <AddressSearch value={form.address} onChange={(v) => set('address', v)} />
            </Field>
            <Field label="전화번호" required>
              <input type="tel" value={form.phone} onChange={(e) => set('phone', formatPhone(e.target.value))} placeholder="010-0000-0000" className="input-field" />
            </Field>
            <Field label="사업자번호" required>
              <input type="text" value={form.businessNumber} onChange={(e) => set('businessNumber', formatBusinessNumber(e.target.value))} placeholder="000-00-00000" className="input-field" />
            </Field>
            <div>
              <span className="text-xs font-semibold text-foreground">가입 목적</span>
              <div className="flex gap-3 mt-1">
                {['교원모집', '구인'].map((p) => (
                  <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={form.purpose.includes(p)} onChange={() => togglePurpose(p)} className="accent-[#66c477]" />
                    <span className="text-sm">{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <Field label="가까운 역 (최대 2개)">
              <div className="flex gap-2">
                <input type="text" value={form.nearbyStations[0]} onChange={(e) => setStation(0, e.target.value)} placeholder="예: 역삼역" className="input-field" />
                <input type="text" value={form.nearbyStations[1]} onChange={(e) => setStation(1, e.target.value)} placeholder="예: 강남역" className="input-field" />
              </div>
            </Field>
            <Field label="운영반 갯수">
              <input type="number" min="0" value={form.classCount} onChange={(e) => set('classCount', e.target.value)} placeholder="예: 6" className="input-field" />
            </Field>
            <div>
              <span className="text-xs font-semibold text-foreground mb-1 block">전경 사진 (선택)</span>
              <PhotoUpload ref={photoRef} label="기관 사진을 선택해주세요 (여러 장 가능)" multiple iconName="home" deferred />
              <p className="text-[11px] text-muted mt-1.5 leading-[1.5]">
                {PHOTO_GUIDANCE.institution.description}<br />
                권장 사이즈: {PHOTO_GUIDANCE.institution.recommendedSize} ({PHOTO_GUIDANCE.institution.aspectRatio})
              </p>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full py-3 bg-[#66c477] hover:bg-[#4EA85E] text-white font-semibold rounded-xl disabled:opacity-50 transition-colors flex items-center justify-center">
            {loading ? <ButtonSpinner /> : '가입하기'}
          </button>
        </form>

        <p className="text-center text-xs text-muted mt-4">
          이미 계정이 있으신가요? <Link href="/login" className="text-[#4EA85E] font-semibold hover:underline">로그인</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-foreground">{label} {required && <span className="text-danger">*</span>}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export default function InstitutionSignup() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <InstitutionSignupContent />
    </Suspense>
  );
}
