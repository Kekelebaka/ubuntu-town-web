import { cn } from '@/lib/utils';

export interface TownScoreBadgeProps {
  /** 0–100 town readiness score. */
  score: number;
  className?: string;
}

function band(s: number): { label: string; color: string } {
  if (s >= 75) return { label: 'Thriving', color: 'var(--color-ubuntu-green)' };
  if (s >= 50) return { label: 'Rising', color: 'var(--color-ubuntu-orange)' };
  if (s >= 25) return { label: 'Emerging', color: 'var(--color-ubuntu-amber)' };
  return { label: 'Seeded', color: 'var(--color-ubuntu-muted)' };
}

/** Compact Town Score pill with a readiness band. Server component. */
export function TownScoreBadge({ score, className }: TownScoreBadgeProps) {
  const b = band(score);
  return (
    <span className={cn('inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1', className)}>
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: b.color }} aria-hidden />
      <span className="font-display text-sm font-bold text-foreground">{score}</span>
      <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{b.label}</span>
    </span>
  );
}
