// src/app/operate/province/[slug]/page.tsx — PROVINCE (Geography OS).
// Province is an aggregation of real child objects. No province statistic exists that cannot
// be derived from child records. Every derived metric shows how it was calculated.

import Link from 'next/link';
import { getCanonicalTowns, provinceGroups, provinceSlug } from '@/lib/e003/os';
import { packForTown } from '@/lib/e003/field-intelligence/packs';
import { Stamp, Section, ContextBar, NextMoves, StateBlock } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function ProvincePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const towns = await getCanonicalTowns();
  const group = provinceGroups(towns).find((p) => provinceSlug(p.province) === slug);

  if (!group) {
    return (
      <div>
        <ContextBar trail={[{ label: 'Towns', href: '/operate/national' }, { label: 'Unknown province' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">Province not in the canonical geography</h1>
        <p className="mt-2 text-sm text-[#5A4E6D]">Nine provinces are represented. This slug is not one of them — and none is invented.</p>
        <Link href="/operate/national" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Return to National</Link>
      </div>
    );
  }

  const packTowns = group.towns.filter((t) => packForTown(t.name));
  const founding = group.towns.filter((t) => t.is_founding).length;

  return (
    <div>
      <ContextBar trail={[{ label: 'Towns', href: '/operate/national' }, { label: group.province }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Geography OS · province</p>
        <h1 className="mt-2 text-3xl font-black">{group.province.toUpperCase()}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">What is happening in this province? Every number below is derived from child records — nothing is invented at province level.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">{group.towns.length} canonical database rows</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{founding} founding-flagged (ratification pending)</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{packTowns.length} with field intelligence</span>
        </div>
      </section>

      {/* DERIVED METRICS WITH CALCULATION */}
      <Section title="How this was calculated" right={<Stamp kind="computed" />}>
        <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
          <dl className="space-y-2 text-xs text-[#5A4E6D]">
            <div><dt className="inline font-semibold text-[#241A33]">Database rows in province: </dt>
              <dd className="inline">{group.towns.length} = count of uto.towns rows where province = "{group.province}" (live read).</dd></div>
            <div><dt className="inline font-semibold text-[#241A33]">Founding-flagged: </dt>
              <dd className="inline">{founding} = rows where is_founding = true (source: Founding-50 reconciliation migration 20260707002039). Flag ≠ ratified roster.</dd></div>
            <div><dt className="inline font-semibold text-[#241A33]">Field intelligence: </dt>
              <dd className="inline">{packTowns.length} = towns with a town pack in the v1 field-intelligence exports.</dd></div>
            <div><dt className="inline font-semibold text-[#241A33]">Operational coverage: </dt>
              <dd className="inline">not computed — requires protected deployment/role records (RECORDS NOT ACCESSIBLE).</dd></div>
          </dl>
        </div>
      </Section>

      {/* TOWNS */}
      <Section title="Towns in this province">
        <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <ul className="divide-y divide-[#F1E8DC]">
            {group.towns.map((t) => (
              <li key={t.id}>
                <Link href={`/operate/town/${t.slug}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 hover:bg-[#FAF5EE]">
                  <div>
                    <p className="text-sm font-semibold text-[#241A33]">{t.name}</p>
                    <p className="text-[11px] text-[#8B7FA3]">
                      record status {t.status ?? 'unset'} · recruitment {t.recruitment_status ?? 'unset'} ·
                      applicants {t.applicant_count ?? 0}{t.opportunity_notes ? ' · opportunity context available' : ''}
                      {packForTown(t.name) ? ' · field intelligence' : ''}
                    </p>
                  </div>
                  <span className="text-xs text-[#5B2A86]">open town →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* PEOPLE / WORK / PROOF / ECONOMICS — honest */}
      <Section title="People · work · proof · economics">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StateBlock title="People" body="RECORDS NOT ACCESSIBLE — role and person records for this province are protected. Leadership coverage is never inferred from town counts." />
          <StateBlock title="Work · proof" body="RECORDS NOT ACCESSIBLE — operational records are protected. PROOF GAP where standards exist without captured evidence." />
          <StateBlock title="Economics" body="NOT YET MEASURED — no economic records accessible at province level. Province economics would be aggregated from child records only." />
          <StateBlock title="Risks · opportunities · learning" body="Insufficient evidence at province level beyond what child towns record (see town pages for field intelligence). Nothing is aggregated without child support." />
        </div>
      </Section>

      <div className="mt-8">
        <CoS context={`Province · ${group.province}`}
          observe={[{
            kind: 'computed',
            text: `${group.province} contains ${group.towns.length} of the ${towns.length} canonical database rows; ${founding} carry the founding flag; ${packTowns.length} carry field intelligence.`,
            evidence: ['uto.towns (live read)', 'field-intelligence packs'],
            reasoning: 'Counts derived from child records only.',
            limitation: 'Database rows ≠ Blueprint cohort membership. Operational coverage is not computed.',
          }]}
          explain={[]} challenge={[]} coach={[]} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Open a town with field intelligence', href: packTowns[0] ? `/operate/town/${packTowns[0].slug}` : '/operate/national' },
          { label: 'Back to National', href: '/operate/national' },
        ]} />
      </div>
    </div>
  );
}
