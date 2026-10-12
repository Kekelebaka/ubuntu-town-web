// src/components/e003/os-ui.tsx — EXPERIENCE 003 component system (server-safe).
// A LIVING OPERATING SYSTEM: stamps, evidence contracts, honest states, operating cells.
// Colour never carries meaning alone — every state ships its word.

import Link from 'next/link';
import type { OSStatement, MetricContract, StatementKind } from '@/lib/e003/os';

// ---------- STAMPS (trust language) ----------
const STAMP_STYLE: Record<string, [string, string]> = {
  computed: ['COMPUTED', 'border-[#9DC9B4] bg-[#EDF6F1] text-[#2F7D5C]'],
  derived: ['DERIVED', 'border-[#9DC9B4] bg-[#EDF6F1] text-[#2F7D5C]'],
  inferred: ['INFERRED', 'border-[#E7C9A0] bg-[#FDF3E3] text-[#8A5410]'],
  authored: ['AUTHORED', 'border-[#D9C7EA] bg-[#F7F1FB] text-[#5B2A86]'],
  insufficient_evidence: ['INSUFFICIENT EVIDENCE', 'border-[#E8B4B0] bg-[#FDF1F0] text-[#A63B33]'],
  records_not_accessible: ['RECORDS NOT ACCESSIBLE', 'border-[#E7C9A0] bg-[#FDF3E3] text-[#8A5410]'],
  absent: ['ABSENT', 'border-[#D9C7EA] bg-[#F7F1FB] text-[#5B2A86]'],
  not_yet_measured: ['NOT YET MEASURED', 'border-[#D9C7EA] bg-[#F7F1FB] text-[#5B2A86]'],
  real: ['REAL', 'border-[#9DC9B4] bg-[#EDF6F1] text-[#2F7D5C]'],
  synthetic: ['SYNTHETIC', 'border-[#E8B4B0] bg-[#FDF1F0] text-[#A63B33]'],
  contradiction: ['CONTRADICTION', 'border-[#E8B4B0] bg-[#FDF1F0] text-[#A63B33]'],
  zero: ['ZERO (EVIDENCED)', 'border-[#9DC9B4] bg-[#EDF6F1] text-[#2F7D5C]'],
};

export function Stamp({ kind }: { kind: StatementKind | string }) {
  const s = STAMP_STYLE[kind] ?? STAMP_STYLE.authored;
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-[0.08em] ${s[1]}`}>
      {s[0]}
    </span>
  );
}

// ---------- STATE BLOCKS (one voice for honest states) ----------
export function StateBlock({ title, body, action }: { title: string; body: string; action?: { label: string; href: string } }) {
  return (
    <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A5410]">{title}</p>
      <p className="mt-2 text-sm leading-relaxed text-[#5A4E6D]">{body}</p>
      {action && (
        <Link href={action.href} className="mt-3 inline-block rounded-full border border-[#8A5410] px-4 py-1.5 text-xs font-semibold text-[#8A5410] hover:bg-[#FDF3E3]">
          {action.label} →
        </Link>
      )}
    </div>
  );
}

// ---------- STATEMENT (CoS-grade claim with WHY) ----------
export function StatementRow({ s }: { s: OSStatement }) {
  return (
    <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-[#241A33]">{s.text}</p>
        <Stamp kind={s.kind} />
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5B2A86]">Why?</summary>
        <div className="mt-2 space-y-1 text-xs text-[#5A4E6D]">
          {s.evidence.length > 0 && <p><span className="font-semibold text-[#241A33]">Evidence:</span> {s.evidence.join(' · ')}</p>}
          {s.reasoning && <p><span className="font-semibold text-[#241A33]">Reasoning:</span> {s.reasoning}</p>}
          {s.limitation && <p><span className="font-semibold text-[#241A33]">Limitation:</span> {s.limitation}</p>}
          {s.recommendation && (
            <p className="rounded-lg border border-[#E7C9A0] bg-[#FDF3E3] px-3 py-2">
              <span className="font-semibold text-[#8A5410]">PROPOSED — PENDING HUMAN APPROVAL:</span> {s.recommendation}
            </p>
          )}
        </div>
      </details>
    </div>
  );
}

// ---------- METRIC (evidence contract — no bare numbers) ----------
export function Metric({ m }: { m: MetricContract }) {
  return (
    <div className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">{m.name}</p>
      <p className={`mt-1 text-xl font-black ${m.value === 'NOT YET MEASURED' || m.value === '—' ? 'text-[#8B7FA3]' : 'text-[#241A33]'}`}>{m.value}</p>
      <details className="mt-2">
        <summary className="cursor-pointer text-[10px] font-semibold uppercase tracking-[0.12em] text-[#5B2A86]">Evidence contract</summary>
        <dl className="mt-2 space-y-1 text-[11px] text-[#5A4E6D]">
          <div><dt className="inline font-semibold text-[#241A33]">Formula: </dt><dd className="inline">{m.formula}</dd></div>
          {m.numerator && <div><dt className="inline font-semibold text-[#241A33]">Numerator: </dt><dd className="inline">{m.numerator}</dd></div>}
          {m.denominator && <div><dt className="inline font-semibold text-[#241A33]">Denominator: </dt><dd className="inline">{m.denominator}</dd></div>}
          <div><dt className="inline font-semibold text-[#241A33]">Window: </dt><dd className="inline">{m.window}</dd></div>
          <div><dt className="inline font-semibold text-[#241A33]">Scope: </dt><dd className="inline">{m.scope}</dd></div>
          <div><dt className="inline font-semibold text-[#241A33]">Source: </dt><dd className="inline">{m.source}</dd></div>
          <div><dt className="inline font-semibold text-[#241A33]">Interpretation: </dt><dd className="inline">{m.interpretation}</dd></div>
          <div><dt className="inline font-semibold text-[#241A33]">Limitation: </dt><dd className="inline">{m.limitation}</dd></div>
        </dl>
      </details>
    </div>
  );
}

// ---------- PLACEHOLDER OWNER (vacancy object — never a fake person) ----------
export function PlaceholderOwner({ role }: { role: string }) {
  return (
    <div className="rounded-xl border border-dashed border-[#E7C9A0] bg-[#FDF9F1] px-3 py-2">
      <p className="text-xs font-semibold text-[#241A33]">Ubuntu — Interim {role}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="rounded-full border border-[#E7C9A0] bg-white px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] text-[#8A5410]">INTERIM PLACEHOLDER</span>
        <span className="rounded-full border border-[#E8B4B0] bg-white px-2 py-0.5 text-[9px] font-bold tracking-[0.1em] text-[#A63B33]">OWNER REQUIRED</span>
      </div>
      <p className="mt-1 text-[10px] text-[#8B7FA3]">Vacancy object — real_person=false · appointment_status=VACANT</p>
    </div>
  );
}

// ---------- CONTEXT BAR (always know where you are) ----------
export function ContextBar({ trail }: { trail: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Global context" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#8B7FA3]">
      <span className="font-bold text-[#5B2A86]">UBUNTU TOWN</span>
      {trail.map((c, i) => (
        <span key={i} className="flex items-center gap-1.5">
          <span className="text-[#C9BED6]">→</span>
          {c.href ? <Link href={c.href} className="font-semibold text-[#5B2A86] hover:underline">{c.label}</Link>
            : <span className="font-bold text-[#241A33]">{c.label}</span>}
        </span>
      ))}
    </nav>
  );
}

// ---------- SECTION (typographic hierarchy, not card walls) ----------
export function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">{title}</h2>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

// ---------- NEXT MOVES (no dead ends — every screen answers "what can I do?") ----------
export function NextMoves({ moves }: { moves: { label: string; href?: string }[] }) {
  return (
    <div className="rounded-2xl border border-[#D9B27C] bg-[#FDF3E3] p-5">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A5410]">Next moves</p>
      <ul className="mt-3 space-y-2">
        {moves.map((m, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-[#241A33]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9822B] text-[10px] font-black text-white">{i + 1}</span>
            {m.href ? <Link href={m.href} className="font-semibold hover:underline">{m.label}</Link> : <span>{m.label}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ---------- RECONCILIATION CHIP (governance state, visible where it matters) ----------
export function ReconciliationChip({ state, note }: { state: string; note: string }) {
  const contradiction = state.includes('UNRESOLVED') || state.includes('ABSENT') || state.includes('DATABASE-ONLY');
  return (
    <details className={`rounded-xl border p-3 ${contradiction ? 'border-[#E8B4B0] bg-[#FDF1F0]' : 'border-[#9DC9B4] bg-[#EDF6F1]'}`}>
      <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.12em] text-[#241A33]">
        Portfolio reconciliation: {state}
      </summary>
      <p className="mt-2 text-xs leading-relaxed text-[#5A4E6D]">{note}</p>
    </details>
  );
}
