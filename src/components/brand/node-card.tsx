import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NodeCardProps {
  name: string;
  tagline: string;
  href?: string;
  Icon: LucideIcon;
  /** CSS color reference for the icon chip, e.g. var(--color-ubuntu-purple). */
  accentVar?: string;
  className?: string;
}

/** A single opportunity-node card. Server component (no client hooks). */
export function NodeCard({
  name,
  tagline,
  href = '#',
  Icon,
  accentVar = 'var(--color-ubuntu-purple)',
  className,
}: NodeCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative flex flex-col gap-3 rounded-xl border border-border bg-card p-5',
        'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <span
        className="flex h-11 w-11 items-center justify-center rounded-lg text-white"
        style={{ background: accentVar }}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{tagline}</p>
      </div>
      <span className="mt-auto text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Explore →
      </span>
    </Link>
  );
}
