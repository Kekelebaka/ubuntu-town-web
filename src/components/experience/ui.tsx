// src/components/experience/ui.tsx — EXPERIENCE 001 shared UI atoms (server-safe).
// Design language: African, human, warm, operational. Light-first; Ubuntu Town purple/orange.
// ⚠ Every surface rendered with these atoms carries SYNTHETIC DEMO DATA labelling.

import Link from 'next/link';
import type { PulseStatement } from '@/lib/pulse/types';

export function DemoBanner() {
  return (
    <div className="bg-[#3B1A5E] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#F5C97E]">
      Experience 001 · Synthetic demo data — nothing here is real production data
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  return (
    <header className="mb-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B2600E]">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold leading-tight text-[#241A33] sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-2xl text-base text-[#5A4E6D]">{subtitle}</p>}
    </header>
  );
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm ${className}`}>{children}</div>;
}

export function Metric({ label, value, tone = 'ink' }: { label: string; value: string | number; tone?: 'ink' | 'purple' | 'orange' | 'green' | 'red' }) {
  const color = { ink: 'text-[#241A33]', purple: 'text-[#5B2A86]', orange: 'text-[#B2600E]', green: 'text-[#2F7D5C]', red: 'text-[#C2453B]' }[tone];
  return (
    <div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">{label}</p>
    </div>
  );
}

export function EvidenceChips({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <span className="text-xs text-[#A89BB8]">no evidence rows</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.slice(0, 6).map((id) => (
        <Link key={id} href={evidenceHref(id)}
          className="rounded-full border border-[#E7C9A0] bg-[#FDF3E3] px-2 py-0.5 font-mono text-[10px] text-[#8A5410] hover:bg-[#F8E7CC]">
          {id}
        </Link>
      ))}
      {ids.length > 6 && <span className="text-[10px] text-[#A89BB8]">+{ids.length - 6} more</span>}
    </span>
  );
}

export function evidenceHref(id: string): string {
  if (id.startsWith('syn-work-')) return `/os/mission/${id}`;
  if (id.startsWith('syn-proof-')) return `/os/proof/${id}`;
  if (id.startsWith('syn-learning-')) return `/os/learning/${id}`;
  if (id.startsWith('syn-opp-')) return `/os/opportunity/${id}`;
  if (id.startsWith('syn-person-')) return `/os/person/${id}`;
  if (id.startsWith('syn-signal-')) return '/os/town/klerksdorp';
  return '/os/national';
}

export function StatementCard({ s }: { s: PulseStatement }) {
  const insufficient = s.kind === 'insufficient_evidence';
  return (
    <div className={`rounded-2xl border p-5 ${insufficient ? 'border-[#E8B4B0] bg-[#FDF1F0]' : 'border-[#EADFD2] bg-white'} shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium leading-relaxed text-[#241A33]">{insufficient ? s.reason : s.interpretation}</p>
        <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${insufficient ? 'border-[#D98C87] text-[#A63B33]' : 'border-[#9DC9B4] text-[#2F7D5C]'}`}>
          {insufficient ? 'Insufficient Evidence' : 'Evidence-linked'}
        </span>
      </div>
      {s.capabilityImplication && (
        <p className="mt-3 text-xs text-[#5A4E6D]"><span className="font-semibold text-[#5B2A86]">Capability:</span> {s.capabilityImplication}</p>
      )}
      <div className="mt-2"><EvidenceChips ids={s.evidence} /></div>
      {s.nextAction && (
        <p className="mt-3 text-xs text-[#5A4E6D]">
          <span className="font-semibold">Next:</span> {s.nextAction.action} · <span className="font-semibold">Owner:</span> {s.nextAction.owner} · <span className="font-semibold">Review:</span> {s.nextAction.reviewPoint}
        </p>
      )}
    </div>
  );
}

export function SignalTile({ tile }: { tile: { key: string; headline: string; detail: string; href: string; evidence: string[] } }) {
  return (
    <Link href={tile.href}
      className="group block rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C] hover:shadow-md">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#B2600E]">{tile.key}</p>
      <p className="mt-2 text-lg font-bold leading-snug text-[#241A33] group-hover:text-[#5B2A86]">{tile.headline}</p>
      <p className="mt-1 text-sm text-[#5A4E6D]">{tile.detail}</p>
      <div className="mt-3"><EvidenceChips ids={tile.evidence} /></div>
    </Link>
  );
}

export function Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#8B7FA3]">
      {trail.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[#C9BED6]">→</span>}
          {c.href ? <Link href={c.href} className="font-medium text-[#5B2A86] hover:underline">{c.label}</Link>
            : <span className="font-semibold text-[#5A4E6D]">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-[#EADFD2] pt-6 text-xs text-[#8B7FA3]">
      <p className="font-semibold text-[#5A4E6D]">UBUNTU TOWN OS · Experience 001</p>
      <p className="mt-1 max-w-3xl leading-relaxed">
        Build the person. Build the initiative. Build the town. Every claim links to evidence; where evidence is
        missing the system says so. Consequential actions are proposals only — they require human approval and are
        simulated in this demo. Synthetic demo data. 50 Blueprint towns · 9 provinces navigation model.
      </p>
    </footer>
  );
}
