import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-border mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-1.5 mb-2">
              <Image src="/logo1_gyo.png" alt="교집합" width={22} height={22} />
              <p className="font-bold text-primary-dark">교집합</p>
            </div>
            <p className="text-xs text-muted leading-relaxed">유치원과 교사를 잇는 채용 플랫폼</p>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">서비스</p>
            <nav className="flex flex-col gap-1.5">
              <Link href="/jobs" className="text-xs text-muted hover:text-primary-dark">채용공고</Link>
              <Link href="/talents" className="text-xs text-muted hover:text-primary-dark">인재정보</Link>
              <Link href="/jobs/new" className="text-xs text-muted hover:text-primary-dark">공고등록</Link>
            </nav>
          </div>
          <div>
            <p className="font-semibold text-foreground mb-2">고객지원</p>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted">support@gyojibhap.kr</span>
              <span className="text-xs text-muted">평일 09:00 ~ 18:00</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-6 pt-4">
          <div className="text-[11px] text-muted leading-relaxed space-y-0.5">
            <p>상호: 교집합 | 대표: 최성웅 | 사업자등록번호: 147-51-01159</p>
            <p>주소: 경기도 부천시 소사구 범안로129번길 72, 106동 1301호 (범박동, 일루미스테이트)</p>
            <p className="mt-2">&copy; 2026 교집합. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
