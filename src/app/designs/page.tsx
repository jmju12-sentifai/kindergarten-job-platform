import Link from 'next/link';
import Image from 'next/image';

const designs = [
  {
    slug: 'v1',
    title: '시안 1 · 클린 미니멀',
    desc: '정보 밀도 높은 리스트 중심. 잡코리아 계열 레이아웃을 초록 톤으로 깔끔하게.',
    accent: '#66c477',
  },
  {
    slug: 'v2',
    title: '시안 2 · 부드럽고 귀엽게',
    desc: '파스텔 그린과 라운드가 큰 카드. 친근한 카피와 이모지로 따뜻한 인상.',
    accent: '#A5D6A7',
  },
  {
    slug: 'v3',
    title: '시안 3 · 큐레이션 피드',
    desc: '상단 배너 + 카테고리 그리드 + 가로 스크롤 섹션. 알바천국 감성의 탐색형.',
    accent: '#a7dba7',
  },
];

export default function DesignsIndex() {
  return (
    <div className="max-w-[1200px] mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-1">
        <Image src="/logo1_gyo.png" alt="교집합" width={32} height={32} />
        <h1 className="text-2xl font-bold text-foreground">교집합 메인 시안</h1>
      </div>
      <p className="text-sm text-muted mb-8">세 가지 방향의 홈 화면 시안입니다. 카드 클릭 시 전체 페이지 확인.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {designs.map((d) => (
          <Link
            key={d.slug}
            href={`/designs/${d.slug}`}
            className="group bg-white border border-border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div
              className="h-40 flex items-center justify-center gap-2 text-white tracking-tight"
              style={{ background: `linear-gradient(135deg, ${d.accent}, #4EA85E)` }}
            >
              <Image src="/logo2_gyo.png" alt="" width={48} height={48} className="brightness-0 invert" />
              <span className="text-2xl font-bold">교집합</span>
            </div>
            <div className="p-4">
              <p className="text-xs font-semibold text-primary-dark mb-1">{d.slug.toUpperCase()}</p>
              <h3 className="text-base font-bold text-foreground mb-1.5">{d.title}</h3>
              <p className="text-xs text-muted leading-relaxed">{d.desc}</p>
              <p className="mt-3 text-xs font-semibold text-primary-dark group-hover:underline">
                시안 보기 →
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
