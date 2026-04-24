'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Icon from '@/components/Icon';
import { useToast } from '@/components/Toast';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, hasResume, hasPosting, signOut, loading } = useAuth();
  const { toast } = useToast();
  const isHome = pathname === '/';

  useEffect(() => {
    setLogoSrc('/logo1_gyo.png');
  }, []);

  const navItems = [
    { href: '/jobs', label: '채용공고' },
    { href: '/talents', label: '인재정보' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) router.push(`/jobs?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    if (!confirm('로그아웃 하시겠습니까?')) return;
    setSigningOut(true);
    await signOut();
    toast('로그아웃되었습니다');
    window.location.replace('/');
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="h-14 flex items-center gap-5">
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <span className="w-[28px] h-[28px] flex items-center justify-center">
              {logoSrc && <Image src={logoSrc} alt="교집합" width={28} height={28} priority />}
            </span>
            <span className="text-lg font-bold text-primary-dark tracking-tight">교집합</span>
          </Link>

          {!isHome && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-[460px]">
              <div className="relative w-full">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="유치원명, 지역, 키워드 검색" className="w-full h-9 pl-3.5 pr-16 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary transition-colors" />
                <button type="submit" className="absolute right-0 top-0 h-9 px-4 text-xs font-semibold text-white bg-primary-dark rounded-r-md hover:bg-primary-dark/90 transition-colors">검색</button>
              </div>
            </form>
          )}

          <div className="flex-1" />

          {!loading && (
            <div className="hidden md:flex items-center gap-1.5 text-sm">
              {user ? (
                <>
                  <Link href="/notifications" className="relative p-1.5 text-muted hover:text-foreground">
                    <Icon name="bell" size={18} />
                  </Link>
                  <Link href="/mypage" className="px-3 py-1.5 text-muted hover:text-foreground transition-colors">마이페이지</Link>
                  <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="px-3 py-1.5 rounded text-muted hover:text-foreground hover:bg-background cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {signingOut ? '로그아웃 중...' : '로그아웃'}
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-3 py-1.5 text-muted hover:text-foreground transition-colors">로그인</Link>
                  <span className="text-border">|</span>
                  <Link href="/signup" className="px-3 py-1.5 text-muted hover:text-foreground transition-colors">회원가입</Link>
                </>
              )}
            </div>
          )}

          <button className="md:hidden p-2 text-foreground" onClick={() => setMenuOpen(!menuOpen)} aria-label="메뉴">
            <span className="block w-5 h-0.5 bg-foreground mb-1" />
            <span className="block w-5 h-0.5 bg-foreground mb-1" />
            <span className="block w-5 h-0.5 bg-foreground" />
          </button>
        </div>
      </div>

      <div className="border-t border-border/50 hidden md:block bg-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="relative flex items-center justify-center h-14">
            <nav className="flex items-center">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}
                  className={`px-12 h-14 flex items-center text-[17px] font-bold border-b-[3px] transition-colors ${pathname.startsWith(item.href) ? 'text-primary-dark border-primary-dark' : 'text-foreground/60 border-transparent hover:text-foreground'}`}>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {profile?.user_type === 'institution' && (
                <Link href="/jobs/new" className="px-3.5 py-1.5 text-xs font-semibold text-primary-dark border border-primary-dark rounded hover:bg-primary-dark hover:text-white transition-colors">
                  {hasPosting ? '공고 수정' : '공고 등록'}
                </Link>
              )}
              {profile?.user_type === 'teacher' && (
                hasResume ? (
                  <Link href={`/talents/${user?.id}`} className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-dark rounded hover:bg-primary-dark/90 transition-colors">이력서 조회</Link>
                ) : (
                  <Link href="/resume/edit" className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-dark rounded hover:bg-primary-dark/90 transition-colors">이력서 등록</Link>
                )
              )}
              {!user && (
                <>
                  <Link href="/jobs/new" className="px-3.5 py-1.5 text-xs font-semibold text-primary-dark border border-primary-dark rounded hover:bg-primary-dark hover:text-white transition-colors">공고 등록</Link>
                  <Link href="/resume/edit" className="px-3.5 py-1.5 text-xs font-semibold text-white bg-primary-dark rounded hover:bg-primary-dark/90 transition-colors">이력서 등록</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-border bg-white px-4 pb-4">
          <nav className="flex flex-col pt-2">
            {!isHome && (
              <form onSubmit={(e) => { handleSearch(e); setMenuOpen(false); }} className="pb-3">
                <div className="relative w-full">
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="유치원명, 지역, 키워드 검색" className="w-full h-10 pl-3.5 pr-16 bg-background border border-border rounded-md text-sm focus:outline-none focus:border-primary transition-colors" />
                  <button type="submit" className="absolute right-0 top-0 h-10 px-4 text-xs font-semibold text-white bg-primary-dark rounded-r-md">검색</button>
                </div>
              </form>
            )}
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium py-2.5 border-b border-border/40 text-foreground/80" onClick={() => setMenuOpen(false)}>{item.label}</Link>
            ))}
            {user && (
              <>
                <Link href="/mypage" className="flex items-center justify-between text-sm font-medium py-2.5 border-b border-border/40 text-foreground/80" onClick={() => setMenuOpen(false)}>
                  <span>마이페이지</span>
                </Link>
                <Link href="/notifications" className="flex items-center justify-between text-sm font-medium py-2.5 border-b border-border/40 text-foreground/80" onClick={() => setMenuOpen(false)}>
                  <span className="flex items-center gap-2"><Icon name="bell" size={16} /> 알림</span>
                </Link>
              </>
            )}
            <div className="flex flex-col gap-2 pt-3">
              {profile?.user_type === 'institution' && (
                <Link href="/jobs/new" className="text-center py-2.5 text-xs font-semibold text-primary-dark border border-primary-dark rounded" onClick={() => setMenuOpen(false)}>
                  {hasPosting ? '공고 수정' : '공고 등록'}
                </Link>
              )}
              {profile?.user_type === 'teacher' && (
                hasResume ? (
                  <Link href={`/talents/${user?.id}`} className="text-center py-2.5 text-xs font-semibold text-white bg-primary-dark rounded" onClick={() => setMenuOpen(false)}>이력서 조회</Link>
                ) : (
                  <Link href="/resume/edit" className="text-center py-2.5 text-xs font-semibold text-white bg-primary-dark rounded" onClick={() => setMenuOpen(false)}>이력서 등록</Link>
                )
              )}
              {user ? (
                <button
                  onClick={() => { setMenuOpen(false); handleSignOut(); }}
                  disabled={signingOut}
                  className="w-full text-center py-2 text-xs font-semibold text-muted border border-border rounded disabled:opacity-50"
                >
                  {signingOut ? '로그아웃 중...' : '로그아웃'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <Link href="/signup" className="flex-1 text-center py-2.5 text-xs font-semibold text-primary-dark border border-primary-dark rounded" onClick={() => setMenuOpen(false)}>회원가입</Link>
                  <Link href="/login" className="flex-1 text-center py-2.5 text-xs font-semibold text-white bg-primary-dark rounded" onClick={() => setMenuOpen(false)}>로그인</Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
