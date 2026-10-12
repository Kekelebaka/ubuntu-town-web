// src/app/real/province/[slug]/page.tsx — PROVINCE: real province grouping.
// DERIVED from real rows. Never implies Blueprint cohort membership.

import Link from 'next/link';
import { getCanonicalTowns, getLegacyNarratives, provinceGroups, provinceSlug, coverage, type CanonicalTown } from '@/lib/e002/real';
import { TruthTag, CoveragePanel, RosterNote, E002Crumbs, AccessPanel } from '@/components/e002/ui';
import E002CoS from '@/components/e002/E002CoS';

export const dynamic = 'force-dynamic';

export default async function ProvincePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const towns = await getCanonicalTowns();
  const legacy = await getLegacyNarratives();
  const group = provinceGroups(towns).find((p) => provinceSlug(p.province) === slug);

  if (!group) {
    return (
      <div>
        <E002Crumbs trail={[{ label: 'South Africa', href: '/real' }, { label: 'Unknown province' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">Province not found in the canonical geography</h1>
        <p className="mt-2 text-sm text-[#5A4E6D]">Nine provinces are represented in uto.towns. This slug is not one of them.</p>
        <Link href="/real" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Return to South Africa</Link>
      </div>
    );
  }

  const founding = group.towns.filter((t) => t.is_founding).length;
  const legacyHere = legacy.filter((l) => group.towns.some((t) => t.slug === l.slug));

  return (
    <div>
      <E002Crumbs trail={[{ label: 'South Africa', href: '/real' }, { label: group.province }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Province · real grouping</p>
        <h1 className="mt-2 text-3xl font-black">{group.province.toUpperCase()}</h1>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">{group.towns.length} canonical town records</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{group.towns.filter((t) => t.opportunity_notes).length} with opportunity context</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{founding} carrying the is_founding flag</span>
          {legacyHere.length > 0 && <span className="rounded-full border border-white/30 px-3 py-1">{legacyHere.length} with legacy narrative</span>}
        </div>
        <p className="mt-3 text-xs text-[#E9DDF5]">
          Town counts describe canonical records only. <span className="text-[#F5C97E]">BluePrint cohort membership: roster pending</span> —
          this count is not the approved cohort.
        </p>
      </section>

      <section className="mt-8">
        <RosterNote canonicalCount={group.towns.length} foundingFlag={founding} />
      </section>

      {/* REAL TOWN LIST */}
      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Real town records</h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <ul className="divide-y divide-[#F1E8DC]">
            {group.towns.map((t: CanonicalTown) => (
              <li key={t.id}>
                <Link href={`/real/town/${t.slug}`}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 hover:bg-[#FAF5EE]">
                  <div>
                    <p className="text-sm font-semibold text-[#241A33]">{t.name}</p>
                    <p className="text-[11px] text-[#8B7FA3]">
                      status {t.status ?? 'unset'} · recruitment {t.recruitment_status ?? 'unset'} ·
                      applicants {t.applicant_count ?? 0}{t.opportunity_notes ? ' · context available' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-[#5B2A86]">inspect →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* LEGACY NARRATIVE (separate source) */}
      {legacyHere.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Legacy public town narrative — separate source</h2>
          <div className="mt-4 grid grid-cols-1 gap-3">
            {legacyHere.map((l) => (
              <div key={l.id} className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-bold text-[#241A33]">{l.name} <span className="font-normal text-[#8B7FA3]">· {l.archetype ?? 'no archetype'}</span></p>
                  <TruthTag kind="REAL" />
                </div>
                <p className="mt-1 text-[11px] text-[#8B7FA3]">
                  Source: legacy public.towns record (id {l.id.slice(0, 8)}…), joined to the canonical record by slug.
                  This narrative is NOT merged into the canonical town record.
                </p>
                <Link href={`/real/town/${l.slug}`} className="mt-2 inline-block text-xs font-semibold text-[#5B2A86] hover:underline">
                  open full narrative →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* COVERAGE */}
      <section className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CoveragePanel items={coverage()} />
        <AccessPanel
          what={['Missions', 'Work', 'Proof', 'Role assignments']}
          why="These operational records are protected and are not available to this read-only public experience."
          next="Authorised operational access."
        />
      </section>

      <E002CoS context={`Province · ${group.province}`}
        observe={[
          { kind: 'computed', text: `${group.province} contains ${group.towns.length} of the ${towns.length} canonical town records.`, evidence: ['uto.towns (live read)'], reasoning: 'Count of rows grouped by the province field.', limitation: 'Canonical geography only — not the approved Blueprint cohort.' },
        ]}
        explain={[
          { kind: 'computed', text: `${group.towns.filter((t) => t.status === 'launch' || t.status === 'pilot').length} record(s) in this province carry status launch or pilot.`, evidence: ['uto.towns.status'], reasoning: 'Direct count of the canonical status field.', limitation: 'Record status is not operational progress.' },
        ]} />
    </div>
  );
}
