export const POSITIONS = [
  '담임교사',
  '부담임+방과후교사',
  '방과후교사',
  '단기대체교사',
  '원감',
  '그 외 교사',
] as const;
export type PositionType = typeof POSITIONS[number];

export const POSITION_COLORS: Record<PositionType, { bg: string; text: string; border: string }> = {
  '원감':             { bg: 'bg-pastel-lavender', text: 'text-pastel-lavender-ink', border: 'border-pastel-lavender-ink/20' },
  '담임교사':         { bg: 'bg-pastel-peach',    text: 'text-pastel-peach-ink',    border: 'border-pastel-peach-ink/20' },
  '부담임+방과후교사': { bg: 'bg-pastel-mint',     text: 'text-pastel-mint-ink',     border: 'border-pastel-mint-ink/20' },
  '방과후교사':       { bg: 'bg-pastel-sky',      text: 'text-pastel-sky-ink',      border: 'border-pastel-sky-ink/20' },
  '단기대체교사':     { bg: 'bg-pastel-lemon',    text: 'text-pastel-lemon-ink',    border: 'border-pastel-lemon-ink/20' },
  '그 외 교사':       { bg: 'bg-pastel-rose',     text: 'text-pastel-rose-ink',     border: 'border-pastel-rose-ink/20' },
};

export const CAREER_ROLES = [
  '담임교사',
  '부담임교사',
  '방과후교사',
  '특강교사',
  '원감교사',
  '원장',
  '아르바이트',
  '실습',
  '그 외 교사',
] as const;
export type CareerRole = typeof CAREER_ROLES[number];
