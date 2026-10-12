// src/app/real/page.tsx — NATIONAL: South Africa's real operating picture.
// REAL geography + DERIVED rollups + honest INSUFFICIENT ACCESS for operational layers.
// ⚠ No synthetic records appear on this page.

import Link from 'next/link';
import { getCanonicalTowns, provinceGroups, provinceSlug, geographyDeltas, coverage, nationalStatements } from '@/lib/e002/real';
import { TruthTag, StatementRow, CoveragePanel, RosterNote, E002Crumbs, AccessPanel } from '@/components/e002/ui';
import E002CoS from '@/components/e002/E002CoS';

export const dynamic = 'force-dynamic';

export default async function NationalPage() {
  const towns = await getCanonicalTowns();
  const provinces = provinceGroups(towns);
  const deltas = geographyDeltas(towns, 90);
  const withNotes = towns.filter((t) => t.opportunity_notes);
  const founding = towns.filter((t) => t.is_founding).length;
  const statements = nationalStatements(towns);

  return (
    <div>
      <E002Crumbs trail={[{ label: 'South Africa' }]} />

      {/* HERO — the real operating picture */}
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-12 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5C97E]">Ubuntu Town OS · Experience 002</p>
        <h1 className="mt-3 text-4xl font-black leading-none sm:text-5xl">THE REAL<br />OPERATING PICTURE</h1>
        <p className="mt-4 max-w-2xl text-sm text-[#E9DDF5] sm:text-base">
          This is the canonical geography of the Ubuntu Town network, read live from the
          canonical system. Where operational records are protected, this experience says so
          instead of pretending. <span className="text-[#F5C97E]">This system does not pretend.</span>
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">{towns.length} canonical town records</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{provinces.length} provinces</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{withNotes.length} with public opportunity context</span>
          <span className="rounded-full border border-white/30 px-3 py-1">read-only · RLS-enforced</span>
        </div>
      </section>

      {/* EPISTEMIC STATUS + ROSTER */}
      <section className="mt-8 space-y-4">
        <RosterNote canonicalCount={towns.length} foundingFlag={founding} />
      </section>

      {/* WHAT CHANGED */}
      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">What changed?</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm leading-relaxed text-[#241A33]">
                In the last {deltas.windowDays} days: {deltas.created.length} canonical town record(s) created,
                {' '}{deltas.updated.length} updated. Window: rolling {deltas.windowDays} days, source: uto.towns timestamps.
              </p>
              <TruthTag kind="computed" />
            </div>
            {(deltas.created.length > 0 || deltas.updated.length > 0) && (
              <p className="mt-2 text-xs text-[#5A4E6D]">
                Rows: {[...deltas.created, ...deltas.updated].slice(0, 8).map((t) => t.name).join(' · ')}
              </p>
            )}
          </div>
          <StatementRow s={{
            kind: 'insufficient_evidence',
            text: 'No comparable prior state is available for operational change.',
            evidence: [],
            limitation: 'Missions, work, proof and role records are not accessible to this experience, and no prior-state store exists. A baseline will never be fabricated.',
          }} />
        </div>
      </section>

      {/* PROVINCES */}
      <section id="provinces" className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Provinces — {provinces.length} real groupings</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {provinces.map((p) => (
            <Link key={p.province} href={`/real/province/${provinceSlug(p.province)}`}
              className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold text-[#241A33]">{p.province}</p>
                <span className="text-xs text-[#8B7FA3]">{p.towns.length} towns</span>
              </div>
              <p className="mt-1 text-[11px] text-[#5A4E6D]">
                {p.towns.filter((t) => t.opportunity_notes).length} with opportunity context ·{' '}
                {p.towns.filter((t) => t.status === 'launch' || t.status === 'pilot').length} in launch/pilot
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* OPPORTUNITY CONTEXT */}
      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">
          Publicly visible opportunity context — real field values
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {withNotes.slice(0, 8).map((t) => (
            <Link key={t.id} href={`/real/town/${t.slug}`}
              className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-bold text-[#241A33]">{t.name} <span className="font-normal text-[#8B7FA3]">· {t.province}</span></p>
                <TruthTag kind="REAL" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-[#5A4E6D]">{t.opportunity_notes}</p>
            </Link>
          ))}
        </div>
        <p className="mt-3 text-[11px] text-[#8B7FA3]">
          Opportunity notes are canonical record context — not verified demand, not commitments.
        </p>
      </section>

      {/* COVERAGE + ACCESS */}
      <section id="coverage" className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CoveragePanel items={coverage()} />
        <AccessPanel
          what={['Missions', 'Work', 'Proof', 'Role assignments']}
          why="These operational records are protected and are not available to this read-only public experience."
          next="Authorised operational access."
        />
      </section>

      <E002CoS context="National scope · real geography"
        observe={statements.filter((s) => s.kind === 'computed')}
        explain={statements.filter((s) => s.kind === 'computed').slice(0, 2)} />
    </div>
  );
}
