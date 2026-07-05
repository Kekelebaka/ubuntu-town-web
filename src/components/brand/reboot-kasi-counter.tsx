'use client';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface RebootKasiCounterProps {
  current: number;
  target: number;
  label?: string;
  className?: string;
}

/**
 * Reboot Kasi progress counter. Animates the current value on mount and shows
 * progress toward the campaign target. Wire `current`/`target` to live uto
 * data (opportunity_points) in Phase 2 — this component is presentation only.
 */
export function RebootKasiCounter({
  current,
  target,
  label = 'Opportunity Points activated',
  className,
}: RebootKasiCounterProps) {
  const pct = Math.min(100, Math.round((current / Math.max(1, target)) * 100));
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 1200;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setDisplay(Math.round(current * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current]);

  return (
    <div className={cn('rounded-xl border border-border bg-card p-5', className)}>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Reboot Kasi</span>
        <span className="font-mono text-xs text-muted-foreground">{pct}%</span>
      </div>
      <div className="mt-2 font-display text-3xl font-extrabold text-foreground">
        {display.toLocaleString()}{' '}
        <span className="text-muted-foreground">/ {target.toLocaleString()}</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full transition-[width] duration-1000 ease-out"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--color-ubuntu-purple), var(--color-ubuntu-orange))' }}
        />
      </div>
    </div>
  );
}
