import Link from 'next/link';
import { HelpCircle, ListChecks, Sparkles } from 'lucide-react';

export type GuidanceTone = 'explain' | 'guide' | 'kopano';

const toneMap = {
  explain: { icon: HelpCircle, color: 'var(--color-ubuntu-purple)', bg: 'var(--secondary)' },
  guide: { icon: ListChecks, color: 'var(--color-ubuntu-orange)', bg: 'rgba(232,115,74,.12)' },
  kopano: { icon: Sparkles, color: '#fff', bg: 'linear-gradient(135deg, var(--color-ubuntu-purple), #521350)' },
};

export default function GuidanceCard({
  eyebrow = 'What is this?',
  title,
  body,
  next,
  href,
  tone = 'explain',
}: {
  eyebrow?: string;
  title: string;
  body: string;
  next?: string;
  href?: string;
  tone?: GuidanceTone;
}) {
  const cfg = toneMap[tone];
  const Icon = cfg.icon;
  const dark = tone === 'kopano';
  return (
    <div style={{ background: cfg.bg, border: dark ? 'none' : '1px solid var(--border)', borderRadius: 14, padding: 14, color: dark ? '#fff' : 'var(--foreground)' }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ flex: 'none', width: 34, height: 34, borderRadius: 10, background: dark ? 'rgba(255,255,255,.16)' : 'var(--card)', color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: 'block', fontSize: 10.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '.08em', color: dark ? '#F4EAF2' : 'var(--muted-foreground)' }}>{eyebrow}</span>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 800, marginTop: 2 }}>{title}</span>
          <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.5, color: dark ? '#F4EAF2' : 'var(--muted-foreground)', marginTop: 4 }}>{body}</span>
          {next && <span style={{ display: 'block', fontSize: 12.5, lineHeight: 1.5, fontWeight: 700, marginTop: 8 }}>Next: {href ? <Link href={href} style={{ color: dark ? '#fff' : 'var(--color-ubuntu-purple)' }}>{next}</Link> : next}</span>}
        </span>
      </div>
    </div>
  );
}

export function ActionableEmptyState({
  icon,
  title,
  body,
  action,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action: string;
  href: string;
}) {
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 26, textAlign: 'center' }}>
      <div style={{ marginBottom: 10 }}>{icon}</div>
      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--foreground)', margin: '0 0 4px' }}>{title}</p>
      <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '0 auto 14px', maxWidth: 360, lineHeight: 1.5 }}>{body}</p>
      <Link href={href} style={{ display: 'inline-flex', background: 'var(--color-ubuntu-orange)', color: '#fff', padding: '10px 16px', borderRadius: 10, fontWeight: 800, fontSize: 13, textDecoration: 'none' }}>
        {action}
      </Link>
    </div>
  );
}
