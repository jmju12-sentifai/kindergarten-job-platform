import Link from 'next/link';
import type { JobPosting } from '@/data/mock';

export default function JobCard({ job }: { job: JobPosting }) {
  const daysLeft = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm hover:border-primary/50 transition-all duration-150">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <h3 className="text-[13px] font-semibold text-foreground leading-snug line-clamp-1">
            {job.title}
          </h3>
          <span className={`text-xs font-bold flex-shrink-0 ${daysLeft > 7 ? 'text-primary-dark' : daysLeft > 0 ? 'text-badge-dday' : 'text-muted line-through'}`}>
            {daysLeft > 0 ? `D-${daysLeft}` : '마감'}
          </span>
        </div>

        <p className="text-xs text-muted mb-2">
          {job.kindergarten.name} · {job.kindergarten.addressShort}
        </p>

        <div className="flex flex-wrap gap-1">
          <span className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground/60 rounded">{job.employmentType}</span>
          <span className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground/60 rounded">{job.ageGroup}</span>
          <span className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground/60 rounded">{job.salary.length > 10 ? job.salary.slice(0, 10) + '..' : job.salary}</span>
          {job.mealProvided && <span className="text-[11px] px-1.5 py-0.5 bg-secondary text-foreground/60 rounded">식사제공</span>}
        </div>
      </div>
    </Link>
  );
}
