'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase';
import Icon from '@/components/Icon';
import type { InstitutionProfile, PostingWithPositions } from '@/types/database';

function getDaysLeft(deadline: string) {
  return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
}

export default function InstitutionDetailPage() {
  const params = useParams();
  const institutionId = params.id as string;

  const [institution, setInstitution] = useState<InstitutionProfile | null>(null);
  const [posting, setPosting] = useState<PostingWithPositions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data: instData } = await supabase
        .from('institution_profiles')
        .select('*')
        .eq('id', institutionId)
        .single();
      setInstitution(instData);

      const { data: postingData } = await supabase
        .from('postings')
        .select('*, position_entries(*), institution_profiles!inner(*)')
        .eq('institution_id', institutionId)
        .single();
      setPosting(postingData as PostingWithPositions | null);

      setLoading(false);
    })();
  }, [institutionId]);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted">로딩중...</p>
      </div>
    );
  }

  if (!institution) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 py-16 text-center">
        <p className="text-sm text-muted">유치원 정보를 찾을 수 없습니다.</p>
        <Link href="/jobs" className="mt-3 inline-block text-xs text-primary-dark hover:underline">
          공고 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-muted mb-5">
        <Link href="/jobs" className="hover:text-primary-dark">
          채용공고
        </Link>
        <span>/</span>
        <span className="text-foreground/80 truncate">{institution.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-4">
          {/* Institution Header */}
          <div className="bg-white border border-border rounded-lg p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon name="school" size={28} className="text-primary-dark" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-foreground mb-1">{institution.name}</h1>
                <p className="text-xs text-muted mb-2">{institution.address}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 bg-secondary text-foreground/70 rounded font-medium">
                    {institution.type}
                  </span>
                  {institution.evaluation_grade && (
                    <span className="text-[11px] px-2 py-0.5 bg-secondary text-foreground/70 rounded font-medium">
                      평가 {institution.evaluation_grade}등급
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Institution Details */}
          <div className="bg-white border border-border rounded-lg p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">유치원 정보</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-4 text-xs">
              <div>
                <span className="text-muted">설립유형</span>
                <p className="text-foreground font-medium">{institution.type}</p>
              </div>
              <div>
                <span className="text-muted">원장</span>
                <p className="text-foreground font-medium">{institution.director_name}</p>
              </div>
              <div>
                <span className="text-muted">연락처</span>
                <p className="text-foreground font-medium">{institution.phone}</p>
              </div>
              {institution.student_count != null && (
                <div>
                  <span className="text-muted">원아 수</span>
                  <p className="text-foreground font-medium">{institution.student_count}명</p>
                </div>
              )}
              {institution.class_count != null && (
                <div>
                  <span className="text-muted">학급 수</span>
                  <p className="text-foreground font-medium">{institution.class_count}학급</p>
                </div>
              )}
              {institution.evaluation_grade && (
                <div>
                  <span className="text-muted">평가등급</span>
                  <p className="text-foreground font-medium">{institution.evaluation_grade}등급</p>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {institution.description && (
            <div className="bg-white border border-border rounded-lg p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">유치원 소개</h2>
              <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-line">
                {institution.description}
              </p>
            </div>
          )}

          {/* Photos */}
          {institution.photos && institution.photos.length > 0 && (
            <div className="bg-white border border-border rounded-lg p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">사진</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {institution.photos.map((photo, i) => (
                  <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden border border-border bg-secondary/30">
                    <img
                      src={photo}
                      alt={`${institution.name} 사진 ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Current Posting */}
          {posting && (
            <div className="bg-white border border-border rounded-lg p-5">
              <h2 className="text-sm font-bold text-foreground mb-3">현재 채용 공고</h2>
              <Link href={`/jobs/${posting.id}`} className="block hover:opacity-80">
                <div className="border border-border rounded-lg p-4 hover:shadow-sm hover:border-primary/50 transition-all">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="text-[13px] font-semibold text-foreground leading-snug">
                      {posting.title}
                    </h3>
                    {(() => {
                      const daysLeft = getDaysLeft(posting.deadline);
                      return (
                        <span
                          className={`text-xs font-bold flex-shrink-0 ${
                            daysLeft > 7
                              ? 'text-primary-dark'
                              : daysLeft > 0
                              ? 'text-badge-dday'
                              : 'text-muted line-through'
                          }`}
                        >
                          {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
                        </span>
                      );
                    })()}
                  </div>
                  <p className="text-xs text-muted mb-2">마감: {posting.deadline}</p>
                  <div className="flex flex-wrap gap-1">
                    {posting.position_entries.map((pe) => (
                      <span
                        key={pe.id}
                        className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground/60 rounded"
                      >
                        {pe.position} ({pe.age_group})
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Map Placeholder */}
          <div className="bg-white border border-border rounded-lg p-5">
            <h2 className="text-sm font-bold text-foreground mb-3">위치</h2>
            <p className="text-xs text-muted mb-2">{institution.address}</p>
            <div className="w-full h-56 rounded-lg border border-border bg-secondary/30 flex items-center justify-center">
              <p className="text-xs text-muted">지도 영역</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="bg-white border border-border rounded-lg p-5 lg:sticky lg:top-[120px]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Icon name="school" size={22} className="text-primary-dark" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">{institution.name}</h3>
                <p className="text-[11px] text-muted">{institution.address_short}</p>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted">설립유형</span>
                <span className="text-foreground font-medium">{institution.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">원장</span>
                <span className="text-foreground font-medium">{institution.director_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">연락처</span>
                <span className="text-foreground font-medium">{institution.phone}</span>
              </div>
              {institution.student_count != null && institution.class_count != null && (
                <div className="flex justify-between">
                  <span className="text-muted">원아/학급</span>
                  <span className="text-foreground font-medium">
                    {institution.student_count}명/{institution.class_count}학급
                  </span>
                </div>
              )}
              {institution.evaluation_grade && (
                <div className="flex justify-between">
                  <span className="text-muted">평가등급</span>
                  <span className="text-foreground font-medium">{institution.evaluation_grade}등급</span>
                </div>
              )}
            </div>

            {posting && (
              <div className="mt-4">
                <Link
                  href={`/jobs/${posting.id}`}
                  className="block w-full py-2.5 text-center bg-primary-dark text-white font-semibold rounded hover:bg-primary-dark/90 transition-colors text-xs"
                >
                  채용공고 보기
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
