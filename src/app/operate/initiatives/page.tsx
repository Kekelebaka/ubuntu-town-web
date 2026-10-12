// src/app/operate/initiatives/page.tsx — INITIATIVES PORTFOLIO (Portfolio OS).
// "The ten engines moving Ubuntu Town." Composition, not a card grid. The canonical ten are
// the portfolio; database-only rows are marked, never promoted.

import Link from 'next/link';
import { CANONICAL_TEN, DATABASE_ONLY_ROWS, RECONCILIATION_SUMMARY } from '@/lib/e003/registry';
import { getCanonicalTowns, provinceGroups } from '@/lib/e003/os';
import { packForTown } from '@/lib/e003/field-intelligence/packs';
import { Stamp, Section, ContextBar, NextMoves, ReconciliationChip } from '@/components/e003/os-ui';

export const dynamic = 'force-dynamic';

export default async function Portfolio() {
  const towns = await getCanonicalTowns();
  const provinces = provinceGroups(towns);
  const packTowns = towns.filter((t) => packForTown(t.name));

  return (
    <div>
      <ContextBar trail={[{ label: 'Initiatives' }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Portfolio OS</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">THE TEN ENGINES MOVING UBUNTU TOWN</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">
          The Blueprint is the portfolio authority. A Supabase row does not become an approved
          initiative merely because it exists. Conflicts are marked — never silently reconciled.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">10 CANONICAL INITIATIVES</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{RECONCILIATION_SUMMARY.dbCatalogRows} database catalog rows</span>
          <span className="rounded-full border border-[#F5C97E] px-3 py-1 text-[#F5C97E]">{RECONCILIATION_SUMMARY.possibleUnresolved + RECONCILIATION_SUMMARY.dbAbsent + RECONCILIATION_SUMMARY.dbOnly} items need human reconciliation</span>
        </div>
      </section>

      {/* PORTFOLIO COMPOSITION TABLE */}
      <Section title="Portfolio" right={<Stamp kind="authored" />}>
        <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <div className="hidden border-b border-[#EADFD2] bg-[#FAF5EE] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B7FA3] lg:grid lg:grid-cols-12">
            <span className="col-span-3">Initiative</span>
            <span className="col-span-3">Purpose</span>
            <span className="col-span-2">Portfolio position</span>
            <span className="col-span-2">Ownership</span>
            <span className="col-span-2">Next move</span>
          </div>
          <ul className="divide-y divide-[#F1E8DC]">
            {CANONICAL_TEN.map((i, idx) => (
              <li key={i.key}>
                <Link href={`/operate/initiative/${i.key}`} className="grid grid-cols-1 gap-1 px-5 py-4 hover:bg-[#FAF5EE] lg:grid-cols-12 lg:items-center lg:gap-3">
                  <span className="col-span-3 text-sm font-bold text-[#241A33]">{idx + 1}. {i.name}</span>
                  <span className="col-span-3 text-xs text-[#5A4E6D]">{i.purpose ?? 'Purpose not materialized — pending Blueprint source'}</span>
                  <span className="col-span-2 text-[11px] text-[#8B7FA3]">
                    {i.reconciliation === 'DB RECORD LINKED' ? 'canonical · linked' : i.reconciliation.includes('UNRESOLVED') ? 'canonical · match unresolved' : 'canonical · database-absent'}
                  </span>
                  <span className="col-span-2 text-[11px] font-semibold text-[#8A5410]">Interim · OWNER REQUIRED</span>
                  <span className="col-span-2 text-xs font-semibold text-[#5B2A86]">open workspace →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* RECONCILIATION — the honest governance surface */}
      <Section title="Portfolio reconciliation — human decision required" right={<Stamp kind="contradiction" />}>
        <div className="overflow-hidden rounded-2xl border border-[#E8B4B0] bg-white shadow-sm">
          <div className="border-b border-[#F1E8DC] bg-[#FDF1F0] px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#A63B33]">
            CONTRADICTION C-01 — Blueprint portfolio vs database catalog
          </div>
          <ul className="divide-y divide-[#F1E8DC]">
            {CANONICAL_TEN.filter((i) => i.reconciliation !== 'DB RECORD LINKED').map((i) => (
              <li key={i.key} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#241A33]">{i.name} <span className="text-xs font-normal text-[#8B7FA3]">— {i.reconciliation}</span></p>
                  <Stamp kind={i.reconciliation.includes('UNRESOLVED') ? 'contradiction' : 'records_not_accessible'} />
                </div>
                <p className="mt-1 text-xs text-[#5A4E6D]">{i.reconciliationNote}</p>
              </li>
            ))}
            {DATABASE_ONLY_ROWS.map((r) => (
              <li key={r.key} className="px-5 py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-semibold text-[#241A33]">{r.name} <span className="text-xs font-normal text-[#8B7FA3]">— DATABASE-ONLY RECORD</span></p>
                  <Stamp kind="contradiction" />
                </div>
                <p className="mt-1 text-xs text-[#5A4E6D]">{r.note} <span className="text-[#8B7FA3]">(tagline: “{r.tagline}”)</span></p>
              </li>
            ))}
          </ul>
          <div className="px-5 py-4">
            <ReconciliationChip
              state={`${RECONCILIATION_SUMMARY.linked} linked · ${RECONCILIATION_SUMMARY.possibleUnresolved} unresolved · ${RECONCILIATION_SUMMARY.dbAbsent} database-absent · ${RECONCILIATION_SUMMARY.dbOnly} database-only`}
              note="Nothing here is merged, renamed, deleted, reinterpreted, substituted, promoted or demoted. Recommended resolution per item is recorded; a human decides. This is a governance state, not a defect count." />
          </div>
        </div>
      </Section>

      {/* DEPLOYMENT VIEW — honest */}
      <Section title="Deployment view">
        <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A5410]">Deployment matrix — {packTowns.length} towns carry field intelligence</p>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {packTowns.map((t) => (
              <Link key={t.id} href={`/operate/town/${t.slug}`}
                className="rounded-xl border border-[#EED9B8] bg-white px-3 py-2 text-xs font-semibold text-[#241A33] hover:border-[#D9B27C]">
                {t.name} <span className="block text-[10px] font-normal text-[#8B7FA3]">{t.province}</span>
              </Link>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-[#5A4E6D]">
            {provinces.length} provinces · {towns.length} canonical database rows. Deployment state per cell: NOT DEPLOYED (state not accessible) until operational records are readable — coverage is never inferred from geography.
          </p>
        </div>
      </Section>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Open FixEasy — the constraint-to-action engine', href: '/operate/initiative/fixeasy' },
          { label: 'Open Senekal × FixEasy — the operating cell', href: '/operate/town/senekal/fixeasy' },
          { label: 'Open People & Capability', href: '/operate/people' },
        ]} />
      </div>
    </div>
  );
}
