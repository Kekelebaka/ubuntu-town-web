// src/app/real/town/[slug]/page.tsx — TOWN: the hero. Real record + honest access state.
// The human pattern: WHAT WE CAN SEE / WHAT WE CANNOT YET SEE / WHY / NEXT EVIDENCE REQUIRED.

import Link from 'next/link';
import { getTownBySlug, getCanonicalTowns, getLegacyNarratives, provinceSlug, geographyDeltas, coverage, townStatements } from '@/lib/e002/real';
import { TruthTag, StatementRow, CoveragePanel, AccessPanel, RosterNote, E002Crumbs } from '@/components/e002/ui';
import E002CoS from '@/components/e002/E002CoS';

export const dynamic = 'force-dynamic';

export default async function TownPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const town = await getTownBySlug(slug);

  if (!town) {
    return (
      <div>
        <E002Crumbs trail={[{ label: 'South Africa', href: '/real' }, { label: 'Unknown town' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">No canonical record for this town</h1>
        <p className="mt-2 text-sm text-[#5A4E6D]">81 canonical towns are represented. This slug is not among them.</p>
        <Link href="/real" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Return to South Africa</Link>
      </div>
    );
  }

  const legacy = (await getLegacyNarratives()).find((l) => l.slug === town.slug);
  const towns = await getCanonicalTowns();
  const deltas = geographyDeltas(towns, 90);
  const townChanged = deltas.updated.some((t) => t.id === town.id);
  const statements = townStatements(town);

  return (
    <div>
      <E002Crumbs trail={[
        { label: 'South Africa', href: '/real' },
        { label: town.province ?? 'Unassigned', href: town.province ? `/real/province/${provinceSlug(town.province)}` : undefined },
        { label: town.name },
      ]} />

      {/* HERO */}
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">
          Real canonical record · {town.province ?? 'province unassigned'}
        </p>
        <h1 className="mt-2 text-3xl font-black">{town.name.toUpperCase()}</h1>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">status {town.status ?? 'unset'}</span>
          <span className="rounded-full border border-white/30 px-3 py-1">recruitment {town.recruitment_status ?? 'unset'}</span>
          <span className="rounded-full border border-white/30 px-3 py-1">applicants {town.applicant_count ?? 0}</span>
          {town.is_founding && <span className="rounded-full border border-[#F5C97E] px-3 py-1 text-[#F5C97E]">is_founding flag</span>}
        </div>
        <p className="mt-3 text-xs text-[#E9DDF5]">
          Record id {town.id} · created {town.created_at.slice(0, 10)} · updated {town.updated_at.slice(0, 10)}
        </p>
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* WHAT WE CAN SEE */}
        <div className="lg:col-span-3">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#2F7D5C]">What we can see</h2>
          <div className="mt-3 rounded-2xl border border-[#9DC9B4] bg-[#F4FAF7] p-5">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
              {[
                ['Name', town.name],
                ['Province', town.province ?? 'unset'],
                ['Status', town.status ?? 'unset'],
                ['Recruitment', town.recruitment_status ?? 'unset'],
                ['Applicants', String(town.applicant_count ?? 0)],
                ['Population estimate', town.population_estimate != null ? String(town.population_estimate) : 'unset'],
                ['Archetype', town.archetype ?? 'unset'],
                ['Municipality link', town.municipality_id ? `record id ${town.municipality_id.slice(0, 8)}… (target protected)` : 'unset'],
                ['is_founding flag', town.is_founding ? 'true' : 'false'],
                ['Last updated', town.updated_at.slice(0, 10)],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B7FA3]">{k}</dt>
                  <dd className="mt-0.5 font-semibold text-[#241A33]">{v}</dd>
                </div>
              ))}
            </dl>
            {town.opportunity_notes && (
              <div className="mt-4 rounded-xl border border-[#C9E2D6] bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B7FA3]">Public opportunity context</p>
                  <TruthTag kind="REAL" />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[#241A33]">{town.opportunity_notes}</p>
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <TruthTag kind="REAL" />
              <p className="text-[11px] text-[#8B7FA3]">Every field above is read live from uto.towns, row id {town.id}.</p>
            </div>
          </div>

          {/* WHAT CHANGED (honest) */}
          <h2 className="mt-8 text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">What changed?</h2>
          <div className="mt-3">
            <StatementRow s={{
              kind: 'computed',
              text: townChanged
                ? `This canonical record was updated within the last ${deltas.windowDays} days.`
                : `This canonical record has not changed in the last ${deltas.windowDays} days (updated ${town.updated_at.slice(0, 10)}).`,
              evidence: [town.id, 'uto.towns.updated_at'],
              reasoning: 'Timestamp comparison against the stated rolling window.',
              limitation: 'Record change is not operational change. Operational history is not accessible.',
            }} />
          </div>
        </div>

        {/* HONEST LIMITS */}
        <div className="lg:col-span-2">
          <AccessPanel
            what={['Missions', 'Work', 'Proof', 'Role']}
            why="These operational records are protected and are not available to this read-only public experience. They are not presented as empty."
            next="Authorised operational access."
          />
          <div className="mt-4">
            <CoveragePanel items={coverage()} />
          </div>
          <div className="mt-4 rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B2A86]">What is my role?</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5A4E6D]">
              You are a <span className="font-bold text-[#241A33]">public visitor</span> — no role assignment is
              available to this experience (role records are protected). No role is assumed and no
              permission is implied.
            </p>
            <p className="mt-2 text-[11px] text-[#8B7FA3]">
              An authorised role lens would answer questions differently per granted scope — behind
              the existing scope resolver and role system, not instead of them.
            </p>
          </div>
        </div>
      </div>

      {/* LEGACY NARRATIVE — separate source, never merged */}
      {legacy && (
        <section className="mt-10 rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-[#5B2A86]">Legacy public town narrative</h2>
              <p className="mt-1 text-[11px] text-[#8B7FA3]">
                Separate source: legacy public.towns record (id {legacy.id.slice(0, 8)}…), archetype
                “{legacy.archetype ?? 'unset'}”, context updated {legacy.context_updated_at?.slice(0, 10) ?? 'unknown'}.
                Joined to the canonical record by slug — <span className="font-semibold">not merged</span> into it.
              </p>
            </div>
            <TruthTag kind="REAL" />
          </div>
          <div className="mt-4 space-y-2">
            {legacy.context && typeof legacy.context === 'object' && 'notes' in (legacy.context as Record<string, unknown>) ? (
              <p className="text-sm leading-relaxed text-[#241A33]">
                {String((legacy.context as Record<string, unknown>).notes).slice(0, 900)}
              </p>
            ) : (
              <p className="text-sm text-[#5A4E6D]">Narrative context present in record (structured JSON).</p>
            )}
          </div>
          <p className="mt-3 text-[11px] text-[#8B7FA3]">
            Provenance: the notes above carry their own source language (e.g. StatsSA Census, municipal
            fact sheets) from the legacy research process. Population figures in this panel may differ
            from the canonical record’s estimate — both sources are shown, neither is silently chosen.
          </p>
        </section>
      )}

      <RosterNote canonicalCount={towns.length} foundingFlag={towns.filter((t) => t.is_founding).length} />

      <E002CoS context={`Town · ${town.name} · ${town.province ?? 'unassigned'}`}
        observe={statements.filter((s) => s.kind === 'computed')}
        explain={statements.filter((s) => s.kind === 'computed')} />
    </div>
  );
}
