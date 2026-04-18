'use client';

import { useState } from 'react';
import { adminStats, jobPostings, teachers } from '@/data/mock';

type AdminTab = 'dashboard' | 'users' | 'postings' | 'reports';

export default function AdminPage() {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'dashboard', label: '대시보드' },
    { id: 'users', label: '회원 관리' },
    { id: 'postings', label: '공고 관리' },
    { id: 'reports', label: '신고 관리' },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      <h1 className="text-lg font-bold text-foreground mb-1">관리자</h1>
      <p className="text-xs text-muted mb-5">플랫폼 운영 현황을 확인하고 관리합니다.</p>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-border mb-5">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
              tab === t.id ? 'text-primary-dark border-primary-dark' : 'text-muted border-transparent hover:text-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Dashboard */}
      {tab === 'dashboard' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '전체 회원', value: adminStats.totalUsers, sub: `이번 달 +${adminStats.newUsersThisMonth}` },
              { label: '등록 유치원', value: adminStats.totalKindergartens },
              { label: '등록 교사', value: adminStats.totalTeachers },
              { label: '진행중 공고', value: adminStats.activeJobPostings, sub: `전체 ${adminStats.totalJobPostings}` },
            ].map((stat) => (
              <div key={stat.label} className="bg-white border border-border rounded-lg p-4">
                <p className="text-[11px] text-muted mb-0.5">{stat.label}</p>
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                {stat.sub && <p className="text-[11px] text-primary-dark mt-0.5">{stat.sub}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-border rounded-lg p-4">
              <p className="text-[11px] text-muted mb-0.5">전체 지원</p>
              <p className="text-xl font-bold text-foreground">{adminStats.totalApplications}건</p>
            </div>
            <div className="bg-white border border-border rounded-lg p-4">
              <p className="text-[11px] text-muted mb-0.5">이번 달 신규 공고</p>
              <p className="text-xl font-bold text-foreground">{adminStats.newPostingsThisMonth}건</p>
            </div>
          </div>

          <div className="bg-white border border-border rounded-lg p-4">
            <h2 className="text-sm font-bold text-foreground mb-3">최근 활동</h2>
            <div className="space-y-2">
              {[
                { time: '10분 전', action: '이수진님이 "만4세반 담임교사 모집"에 지원' },
                { time: '1시간 전', action: '박지현님이 프로필 업데이트' },
                { time: '2시간 전', action: '햇살유치원이 "특별활동 영어강사 모집" 등록' },
                { time: '3시간 전', action: '김하은님이 회원가입' },
                { time: '5시간 전', action: '푸른숲유치원이 "방과후과정 전담교사 모집" 등록' },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className="text-muted flex-shrink-0 w-14">{a.time}</span>
                  <p className="text-foreground/70">{a.action}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users */}
      {tab === 'users' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">회원 목록</h2>
            <input type="text" placeholder="이름, 이메일 검색" className="h-8 px-3 bg-background border border-border rounded text-xs focus:outline-none focus:border-primary w-48" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-background/60">
                  <th className="text-left px-4 py-2.5 font-medium text-muted">이름</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">유형</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">이메일</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">가입일</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">상태</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">관리</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((t) => (
                  <tr key={t.id} className="border-t border-border/40 hover:bg-background/30">
                    <td className="px-4 py-2.5 font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-2.5 text-muted">구직자</td>
                    <td className="px-4 py-2.5 text-muted">{t.name.toLowerCase().replace(/\s/g, '')}@email.com</td>
                    <td className="px-4 py-2.5 text-muted">2026-03-{10 + parseInt(t.id.replace('t', ''))}</td>
                    <td className="px-4 py-2.5"><span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded">활성</span></td>
                    <td className="px-4 py-2.5"><button className="text-[10px] text-danger hover:underline">정지</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Postings */}
      {tab === 'postings' && (
        <div className="bg-white border border-border rounded-lg overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground">공고 목록</h2>
            <select className="h-8 px-2 bg-background border border-border rounded text-xs focus:outline-none focus:border-primary">
              <option>전체 상태</option><option>검수대기</option><option>게시중</option><option>마감</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-background/60">
                  <th className="text-left px-4 py-2.5 font-medium text-muted">공고명</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">유치원</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">등록일</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">마감일</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">지원자</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">상태</th>
                  <th className="text-left px-4 py-2.5 font-medium text-muted">관리</th>
                </tr>
              </thead>
              <tbody>
                {jobPostings.map((job) => (
                  <tr key={job.id} className="border-t border-border/40 hover:bg-background/30">
                    <td className="px-4 py-2.5 font-medium text-foreground max-w-[200px] truncate">{job.title}</td>
                    <td className="px-4 py-2.5 text-muted">{job.kindergarten.name}</td>
                    <td className="px-4 py-2.5 text-muted">{job.postedAt}</td>
                    <td className="px-4 py-2.5 text-muted">{job.deadline}</td>
                    <td className="px-4 py-2.5 text-foreground">{job.applicantCount}명</td>
                    <td className="px-4 py-2.5"><span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded">게시중</span></td>
                    <td className="px-4 py-2.5 space-x-2"><button className="text-[10px] text-primary-dark hover:underline">상세</button><button className="text-[10px] text-danger hover:underline">비공개</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reports */}
      {tab === 'reports' && (
        <div className="bg-white border border-border rounded-lg p-4">
          <h2 className="text-sm font-bold text-foreground mb-3">신고 목록</h2>
          <div className="space-y-2">
            {[
              { id: 'r1', type: '허위공고', target: '별빛유치원 - 보조교사 모집', reporter: '김하은', date: '2026-04-08', status: '검토중' },
              { id: 'r2', type: '부적절한 내용', target: '사용자 프로필: 오서연', reporter: '익명', date: '2026-04-06', status: '처리완료' },
            ].map((r) => (
              <div key={r.id} className="border border-border rounded-md p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[10px] px-1.5 py-0.5 bg-danger/10 text-danger rounded font-medium">{r.type}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.status === '검토중' ? 'bg-secondary text-primary-dark' : 'bg-success/10 text-success'}`}>{r.status}</span>
                    </div>
                    <p className="text-xs font-medium text-foreground">{r.target}</p>
                    <p className="text-[11px] text-muted mt-0.5">신고자: {r.reporter} · {r.date}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button className="text-[11px] px-2.5 py-1 text-primary-dark border border-primary-dark rounded hover:bg-primary/10">상세</button>
                    <button className="text-[11px] px-2.5 py-1 text-danger border border-danger/30 rounded hover:bg-danger/10">조치</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
