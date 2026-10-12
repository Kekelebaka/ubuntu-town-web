// src/app/operate/national/page.tsx — NATIONAL (Geography OS): "What is Ubuntu Town? Where are
// we? What are we building? What can we actually see?" No dashboard theatre: nothing is
// manufactured from geography alone.

import Link from 'next/link';
import { getCanonicalTowns, provinceGroups, provinceSlug, geographyDeltas, nationalStatements } from '@/lib/e003/os';
import { CANONICAL_TEN, DATABASE_ONLY_ROWS, RECONCILIATION_SUMMARY, REMOVED_FROM_PORTFOLIO } from '@/lib/e003/registry';
import { strategicGeography, ROSTER_COUNT, ROSTER_PROVINCES, isBlueprintTown } from '@/lib/e003/roster';
import { FIELD_PACKS } from '@/lib/e003/field-intelligence/packs';
import { Stamp, StateBlock, Section, ContextBar, StatementRow, NextMoves, ReconciliationChip } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function National() {
  const towns = await getCanonicalTowns();
  const provinces = provinceGroups(towns);
  const deltas = geographyDeltas(towns, 90);
  const statements = nationalStatements(towns);
  const founding = towns.filter((t) => t.is_founding).length;

  return (
    <div>
      <ContextBar trail={[{ label: 'Towns', href: '/operate/national' }, { label: 'National' }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Geography OS</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">NATIONAL</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">What is Ubuntu Town? Where are we? What are we building? What can we actually see?</p>
        <div className="mt-5 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">50 BLUEPRINT TOWNS</span>
          <span className="rounded-full border border-white/30 px-3 py-1">9 PROVINCES</span>
          <span className="rounded-full border border-white/30 px-3 py-1">10 CANONICAL INITIATIVES</span>
          <span className="rounded-full border border-[#F5C97E] px-3 py-1 text-[#F5C97E]">DATABASE COVERAGE: 81 CANONICAL ROWS</span>
        </div>
        <p className="mt-3 text-[11px] text-[#E9DDF5]">
          The Blueprint cohort and the database rows are distinct designations and are never conflated.
          Founding-50 evidence exists ({founding} flagged rows — migration 20260707002039); roster ratification is pending.
        </p>
      </section>

      {/* THE THREE-WAY DISTINCTION */}
      <Section title="Orientation — three distinct designations">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#9DC9B4] bg-[#EDF6F1] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2F7D5C]">Canonical blueprint</p>
            <p className="mt-1 text-2xl font-black text-[#241A33]">50 towns</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">The approved activation cohort. Membership evidence exists (Founding-50 names list); the ratified roster artifact is pending — shown honestly as such.</p>
          </div>
          <div className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5B2A86]">Canonical database</p>
            <p className="mt-1 text-2xl font-black text-[#241A33]">81 rows</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">The operational geography records. Not all database rows are Blueprint cohort members. Reconciliation lives in the governance tool.</p>
          </div>
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF3E3] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Operational coverage</p>
            <p className="mt-1 text-2xl font-black text-[#241A33]">INSUFFICIENT EVIDENCE</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">Staffed deployments, ownership and activity require protected operational records — RECORDS NOT ACCESSIBLE. Coverage is never inferred from geography.</p>
          </div>
        </div>
      </Section>

      {/* STRATEGIC GEOGRAPHY — resolves against the Blueprint roster */}
      <Section title="Strategic geography — the Blueprint cohort" right={<Stamp kind="authored" />}>
        <div className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">
            <span className="font-semibold text-[#5B2A86]">{strategicGeography().cohortLabel}</span> — {strategicGeography().cohortNote}
          </p>
          <p className="mt-2 text-[10px] text-[#8A5410]">Roster status: {strategicGeography().ratificationStatus}</p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            {strategicGeography().provinces.map((p) => (
              <div key={p.province} className="rounded-xl border border-[#E3D5F0] bg-white px-3 py-2">
                <p className="text-[11px] font-bold text-[#241A33]">{p.province} <span className="text-[#8B7FA3]">· {p.towns.length} roster towns</span></p>
                <p className="mt-0.5 text-[10px] text-[#5A4E6D]">{p.towns.map((t) => t.name).join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* PROVINCES */}
      <Section title="Database coverage — 81 canonical rows (non-strategic)" right={<Stamp kind="computed" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {provinces.map((p) => {
            const packs = FIELD_PACKS.filter((fp) => p.towns.some((t) => t.name === fp.town)).length;
            return (
              <Link key={p.province} href={`/operate/province/${provinceSlug(p.province)}`}
                className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-bold text-[#241A33]">{p.province}</p>
                  <span className="text-xs text-[#8B7FA3]">{p.towns.length} database rows</span>
                </div>
                <p className="mt-1 text-[11px] text-[#5A4E6D]">
                  {p.towns.filter((t) => t.is_founding).length} founding-flagged · {packs} with field intelligence ·
                  {' '}{p.towns.filter((t) => t.status === 'launch' || t.status === 'pilot').length} in launch/pilot record state
                </p>
              </Link>
            );
          })}
        </div>
      </Section>

      {/* NATIONAL OPERATING SIGNALS — one derived engine, evidence-gated categories */}
      <Section title="National operating signals">
        <div className="space-y-3">
          {statements.map((s, i) => <StatementRow key={i} s={s} />)}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {['MOMENTUM', 'CAPACITY', 'PROOF', 'ECONOMICS'].map((cat) => (
              <div key={cat} className="rounded-2xl border border-[#EADFD2] bg-white p-4 text-center">
                <p className="text-[10px] font-bold tracking-[0.12em] text-[#8B7FA3]">{cat}</p>
                <p className="mt-2 text-xs font-semibold text-[#8A5410]">INSUFFICIENT EVIDENCE</p>
                <p className="mt-1 text-[10px] text-[#8B7FA3]">no evidenced category input</p>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[#8B7FA3]">Signal categories appear only when evidence supports them. Unsupported categories are shown honestly — never as flattering numbers.</p>
        </div>
      </Section>

      {/* WHAT CHANGED */}
      <Section title="What changed?">
        <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed text-[#241A33]">
              Last {deltas.windowDays} days (geography): {deltas.created.length} canonical record(s) created · {deltas.updated.length} updated.
            </p>
            <Stamp kind="computed" />
          </div>
          <p className="mt-2 text-xs text-[#5A4E6D]">
            Operational change (new / improved / declined / stalled / resolved): <span className="font-semibold">CHANGE HISTORY NOT AVAILABLE</span> — no comparable prior state exists for protected objects. Deltas are never manufactured.
          </p>
        </div>
      </Section>

      {/* NATIONAL PORTFOLIO */}
      <Section title="National portfolio — the ten engines" right={<Stamp kind="authored" />}>
        <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <ul className="divide-y divide-[#F1E8DC]">
            {CANONICAL_TEN.map((i) => (
              <li key={i.key}>
                <Link href={`/operate/initiative/${i.key}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#FAF5EE]">
                  <div>
                    <p className="text-sm font-semibold text-[#241A33]">{i.name}</p>
                    <p className="text-[11px] text-[#8B7FA3]">{i.purpose ?? 'Canonical purpose not materialized — pending Blueprint source'}</p>
                  </div>
                  <span className="text-xs text-[#5B2A86]">open →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3">
          <ReconciliationChip
            state={`${RECONCILIATION_SUMMARY.linked} linked · ${RECONCILIATION_SUMMARY.possibleUnresolved} unresolved · ${RECONCILIATION_SUMMARY.dbAbsent} database-absent · ${RECONCILIATION_SUMMARY.dbOnly} database-only rows`}
            note={`The catalog holds 12 rows against the canonical ten. DECIDED 2026-10-12: ${REMOVED_FROM_PORTFOLIO.map((r) => r.name).join(", ")} are REMOVED from the active portfolio (historical rows preserved — not deleted, not merged). Still open: Buntu Bar (possible relation to Ubuntu Socials, C-01) and the Ubuntu Town platform row. None is ever presented as an active canonical initiative.`} />
        </div>
      </Section>

      {/* PEOPLE COVERAGE + ECONOMICS — honest states */}
      <Section title="Coverage & economics">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StateBlock title="People coverage" body="Town coordinator coverage, initiative leadership coverage and capability gaps require accessible role-assignment records — RECORDS NOT ACCESSIBLE. Coverage is never implied by town counts." action={{ label: 'open People & Capability', href: '/operate/people' }} />
          <StateBlock title="Economic view" body="GMV, revenue, cost, contribution and town operating result: NOT YET MEASURED at national level — no economic records are accessible and no values are manufactured from geography." />
        </div>
      </Section>

      <div className="mt-8">
        <CoS context="National · pattern altitude"
          observe={statements.filter((s) => s.kind === 'computed')}
          explain={statements}
          challenge={[statements[3]]}
          coach={[]}
          proposal={{
            title: 'Ratify cohort designation',
            detail: 'PROPOSAL — PENDING HUMAN APPROVAL: ratify the Blueprint roster artifact so the 50-town cohort designation and the 81 database rows can be reconciled in the governance tool.',
            evidence: ['founding50-names.json (50 names)', 'migration 20260707002039', 'uto.towns (81 rows)'],
          }} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Open Free State — the largest province grouping', href: '/operate/province/free-state' },
          { label: 'Open Senekal — a town with field intelligence', href: '/operate/town/senekal' },
          { label: 'Open the Portfolio OS', href: '/operate/initiatives' },
        ]} />
      </div>
    </div>
  );
}
