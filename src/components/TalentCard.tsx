import Link from 'next/link';
import type { Teacher } from '@/data/mock';

export default function TalentCard({ teacher }: { teacher: Teacher }) {
  return (
    <Link href={`/talents/${teacher.id}`} className="block">
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm hover:border-primary/50 transition-all duration-150">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary flex-shrink-0 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-dark">{teacher.name.charAt(0)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <h3 className="text-[13px] font-semibold text-foreground">{teacher.name}</h3>
              {teacher.available ? (
                <span className="text-[10px] px-1.5 py-px bg-success/10 text-success rounded font-medium">구직중</span>
              ) : (
                <span className="text-[10px] px-1.5 py-px bg-muted/10 text-muted rounded font-medium">비활성</span>
              )}
            </div>
            <p className="text-xs text-muted mb-1.5">
              경력 {teacher.experienceYears}년 · {teacher.education} · {teacher.region}
            </p>
            <div className="flex flex-wrap gap-1">
              {teacher.certificates.slice(0, 2).map((cert) => (
                <span key={cert} className="text-[11px] px-1.5 py-0.5 bg-primary/10 text-primary-dark rounded font-medium">{cert}</span>
              ))}
              {teacher.skills.slice(0, 2).map((skill) => (
                <span key={skill} className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground/50 rounded">{skill}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
