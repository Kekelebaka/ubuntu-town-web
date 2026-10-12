// src/components/e002/ui.tsx — EXPERIENCE 002 shared UI (server-safe).
// Truth over completeness. Epistemic language: COMPUTED / INFERRED / AUTHORED /
// INSUFFICIENT EVIDENCE / INSUFFICIENT ACCESS — elegant tags that increase trust.

import Link from 'next/link';
import type { E002Statement, TruthClass } from '@/lib/e002/real';

export function TruthTag({ kind }: { kind: E002Statement['kind'] | TruthClass }) {
  const map: Record<string, { label: string; cls: string }> = {
    computed: { label: 'COMPUTED', cls: 'border-[#9DC9B4] bg-[#EDF6F1] text-[#2F7D5C]' },
    DERIVED: { label: 'DERIVED', cls: 'border-[#9DC9B4] bg-[#EDF6F1] text-[#2F7D5C]' },
    inferred: { label: 'INFERRED', cls: 'border-[#E7C9A0] bg-[#FDF3E3] text-[#8A5410]' },
    UNVERIFIED: { label: 'UNVERIFIED', cls: 'border-[#E7C9A0] bg-[#FDF3E3] text-[#8A5410]' },
    authored: { label: 'AUTHORED', cls: 'border-[#D9C7EA] bg-[#F7F1FB] text-[#5B2A86]' },
    REAL: { label: 'REAL', cls: 'border-[#9DC9B4] bg-[#EDF6F1] text-[#2F7D5C]' },
    insufficient_evidence: { label: 'INSUFFICIENT EVIDENCE', cls: 'border-[#E8B4B0] bg-[#FDF1F0] text-[#A63B33]' },
    insufficient_access: { label: 'INSUFFICIENT ACCESS', cls: 'border-[#E7C9A0] bg-[#FDF3E3] text-[#8A5410]' },
    'INSUFFICIENT ACCESS': { label: 'INSUFFICIENT ACCESS', cls: 'border-[#E7C9A0] bg-[#FDF3E3] text-[#8A5410]' },
    'NO RECORDS FOUND': { label: 'NO RECORDS FOUND', cls: 'border-[#D9C7EA] bg-[#F7F1FB] text-[#5B2A86]' },
  };
  const s = map[kind] ?? map.authored;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.08em] ${s.cls}`}>
      {s.label}
    </span>
  );
}

export function StatementRow({ s }: { s: E002Statement }) {
  return (
    <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-[#241A33]">{s.text}</p>
        <TruthTag kind={s.kind} />
      </div>
      {(s.reasoning || s.limitation) && (
        <details className="mt-3">
          <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5B2A86]">
            Why?
          </summary>
          <div className="mt-2 space-y-1 text-xs text-[#5A4E6D]">
            {s.evidence.length > 0 && (
              <p><span className="font-semibold">Evidence:</span> {s.evidence.join(' · ')}</p>
            )}
            {s.reasoning && <p><span className="font-semibold">Reasoning:</span> {s.reasoning}</p>}
            {s.limitation && <p><span className="font-semibold">Limitation:</span> {s.limitation}</p>}
          </div>
        </details>
      )}
    </div>
  );
}

export function CoveragePanel({ items }: { items: { layer: string; state: string; note: string }[] }) {
  return (
    <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8B7FA3]">Data coverage</p>
      <div className="mt-3 space-y-2">
        {items.map((c) => (
          <div key={c.layer} className="flex items-start gap-3">
            <span className={`mt-0.5 w-24 shrink-0 text-[11px] font-bold ${c.state === 'AVAILABLE' ? 'text-[#2F7D5C]' : c.state === 'PROTECTED' ? 'text-[#8A5410]' : 'text-[#5B2A86]'}`}>
              {c.state === 'AVAILABLE' ? '✓ AVAILABLE' : c.state === 'PROTECTED' ? '🔒 PROTECTED' : '— NO RECORDS'}
            </span>
            <div>
              <p className="text-xs font-semibold text-[#241A33]">{c.layer}</p>
              <p className="text-[11px] leading-relaxed text-[#8B7FA3]">{c.note}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AccessPanel({ what, why, next }: { what: string[]; why: string; next: string }) {
  return (
    <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
      <div className="flex items-center gap-2">
        <span className="text-lg">🔒</span>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A5410]">What we cannot yet see</p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {what.map((w) => (
          <div key={w} className="rounded-xl border border-[#EED9B8] bg-white px-3 py-2">
            <p className="text-xs font-semibold text-[#241A33]">{w}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#8A5410]">Records not accessible</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Why:</span> {why}</p>
      <p className="mt-1 text-xs leading-relaxed text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Next evidence required:</span> {next}</p>
    </div>
  );
}

export function RosterNote({ canonicalCount, foundingFlag }: { canonicalCount: number; foundingFlag: number }) {
  return (
    <div className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
        <p className="text-[#241A33]"><span className="font-bold text-[#5B2A86]">CANONICAL TOWNS:</span> {canonicalCount} records <TruthTag kind="DERIVED" /></p>
        <p className="text-[#241A33]"><span className="font-bold text-[#5B2A86]">BLUEPRINT TOWNS:</span> ROSTER PENDING <TruthTag kind="UNVERIFIED" /></p>
        <p className="text-[#241A33]"><span className="font-bold text-[#5B2A86]">is_founding flag:</span> {foundingFlag} rows <TruthTag kind="REAL" /></p>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-[#8B7FA3]">
        The canonical flag and the approved Blueprint cohort are not the same thing. This
        experience never resolves that governance decision (G4 open).
      </p>
    </div>
  );
}

export function E002Crumbs({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#8B7FA3]" aria-label="Operating world hierarchy">
      {trail.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-[#C9BED6]">→</span>}
          {c.href ? <Link href={c.href} className="font-semibold text-[#5B2A86] hover:underline">{c.label}</Link>
            : <span className="font-bold text-[#241A33]">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

export function E002Footer() {
  return (
    <footer className="mt-16 border-t border-[#EADFD2] pt-6 text-xs text-[#8B7FA3]">
      <p className="font-semibold text-[#5A4E6D]">UBUNTU TOWN OS · Experience 002 — The Real Town Operating System</p>
      <p className="mt-1 max-w-3xl leading-relaxed">
        Real canonical geography, read live and read-only. Operational layers are protected in
        the canonical system and are shown honestly as not accessible. No synthetic records appear
        on these pages. Consequential actions require authorised human approval and none are
        offered here. Geography: canonical records are not the approved Blueprint cohort (roster
        pending).
      </p>
    </footer>
  );
}
