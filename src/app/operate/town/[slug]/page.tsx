// src/app/operate/town/[slug]/page.tsx — TOWN (Geography OS): "I am inside this town."
// Real record + real field intelligence + honest operating states. Only data that exists.

import Link from 'next/link';
import { getCanonicalTowns, getTownBySlug } from '@/lib/e002/real';
import { getLegacyNarratives } from '@/lib/e002/real';
import { townStatements, buildCell, type CanonicalTown } from '@/lib/e003/os';
import { CANONICAL_TEN } from '@/lib/e003/registry';
import { packForTown, packProvenance } from '@/lib/e003/field-intelligence/packs';
import { signalsForTown } from '@/lib/e003/loop';
import { cohortStamp } from '@/lib/e003/roster';
import { Stamp, StateBlock, Section, ContextBar, StatementRow, NextMoves, PlaceholderOwner, Metric } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function TownPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const town = await getTownBySlug(slug);
  if (!town) {
    return (
      <div>
        <ContextBar trail={[{ label: 'Towns', href: '/operate/national' }, { label: 'Unknown town' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">No canonical database record for this town</h1>
        <p className="mt-2 text-sm text-[#5A4E6D]">81 canonical database rows are represented. This slug is not among them — and no town is invented.</p>
        <Link href="/operate/national" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Return to National</Link>
      </div>
    );
  }

  const pack = packForTown(town.name);
  const cohort = cohortStamp(town.slug);
  const signals = signalsForTown(town);
  const legacy = (await getLegacyNarratives()).find((l) => l.slug === town.slug);
  const statements = townStatements(town, pack);
  const founding = town.is_founding;

  return (
    <div>
      <ContextBar trail={[{ label: 'Towns', href: '/operate/national' }, { label: town.province ?? '—', href: `/operate/province/${(town.province ?? '').toLowerCase().replace(/\s+/g, '-')}` }, { label: town.name }]} />

      {/* TOWN HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">{town.province} · canonical database record</p>
        <h1 className="mt-2 text-4xl font-black">{town.name.toUpperCase()}</h1>
        <div className="mt-3">
          <span className={`rounded-full px-3 py-1 text-[10px] font-bold ${cohort.inCohort ? 'bg-[#F5C97E] text-[#241A33]' : 'bg-white/15 text-white border border-white/30'}`}>{cohort.label}</span>
          <p className="mt-1 max-w-2xl text-[10px] text-[#E9DDF5]">{cohort.note}</p>
        </div>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">record status {town.status ?? 'unset'}</span>
          <span className="rounded-full border border-white/30 px-3 py-1">recruitment {town.recruitment_status ?? 'unset'}</span>
          <span className="rounded-full border border-white/30 px-3 py-1">applicants {town.applicant_count ?? 0}</span>
          {founding && <span className="rounded-full border border-[#F5C97E] px-3 py-1 text-[#F5C97E]">founding flag (ratification pending)</span>}
          {pack && <span className="rounded-full border border-white/30 px-3 py-1">field intelligence {pack.pack_id}</span>}
        </div>
        <div className="mt-4 max-w-md"><PlaceholderOwner role="Town Coordinator" /></div>
        <p className="mt-3 text-[11px] text-[#E9DDF5]">Record id {town.id} · created {town.created_at.slice(0, 10)} · updated {town.updated_at.slice(0, 10)}</p>
      </section>

      {/* TOWN PASSPORT */}
      <Section title="Town passport" right={<Stamp kind={pack ? 'derived' : 'insufficient_evidence'} />}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {([
            ['People', pack ? 'PARTIAL — intelligence only' : 'NOT YET MEASURED', pack ? 'Ecosystem fit recorded in field intelligence. Verified people records: RECORDS NOT ACCESSIBLE.' : 'No evidence available.'],
            ['Place', pack ? 'EVIDENCED' : 'PARTIAL', pack ? `Municipality ${pack.municipality} (${pack.municipality_id}), archetype ${pack.archetype}, nodes: ${pack.township_nodes.join(', ') || '—'}` : 'Canonical record only.'],
            ['Economy', 'NOT YET MEASURED', pack ? `Local economy summary recorded (${pack.pack_id}). Economic records: NOT YET MEASURED.` : 'No economic evidence.'],
            ['Network', pack ? 'PARTIAL' : 'INSUFFICIENT EVIDENCE', pack ? `Ecosystem fit: ${pack.ecosystem_fit.map((e) => e.entity).join(', ') || '—'}` : 'No network evidence.'],
            ['Digital', 'INSUFFICIENT EVIDENCE', 'No digital-domain evidence accessible.'],
            ['Readiness', 'INSUFFICIENT EVIDENCE', 'Readiness is never inferred from geography or archetype. Evidence required per domain.'],
          ] as const).map(([domain, state, note]) => (
            <div key={domain} className="rounded-2xl border border-[#EADFD2] bg-white p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#8B7FA3]">{domain}</p>
              <p className={`mt-1 text-xs font-bold ${state.startsWith('EVIDENCED') ? 'text-[#2F7D5C]' : state.startsWith('NOT YET') || state.startsWith('INSUFFICIENT') ? 'text-[#8A5410]' : 'text-[#5B2A86]'}`}>{state}</p>
              <p className="mt-1 text-[10px] leading-relaxed text-[#5A4E6D]">{note}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* SIGNALS — real recorded signal objects */}
      <div id="signals">
        <Section title="Signals — what the town is signalling" right={<Stamp kind={signals.some((s) => s.class === 'REAL') ? 'real' : 'derived'} />}>
          {signals.length > 0 ? (
            <ul className="space-y-2">
              {signals.map((s) => (
                <li key={s.id} className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="max-w-3xl text-sm text-[#241A33]">{s.text}</p>
                    <Stamp kind={s.class === 'REAL' ? 'real' : 'derived'} />
                  </div>
                  <p className="mt-1 text-[10px] text-[#8B7FA3]">{s.source} · {s.limitation}</p>
                </li>
              ))}
            </ul>
          ) : (
            <StateBlock title="No signals recorded" body="No opportunity notes or research opportunity domains exist for this town in accessible records. This is INSUFFICIENT EVIDENCE of activity — not evidence of absence." />
          )}
          <div className="mt-3 rounded-2xl border border-[#D9B27C] bg-[#FDF3E3] p-4">
            <p className="text-xs text-[#5A4E6D]"><span className="font-semibold text-[#8A5410]">Signal → mission:</span> acting on a signal becomes a PROPOSED MISSION (pending human approval), then work, proof and learning.</p>
            <Link href="/operate/missions" className="mt-1 inline-block text-xs font-semibold text-[#8A5410] hover:underline">open Missions →</Link>
          </div>
        </Section>
      </div>

      {/* WHAT IS MOVING / NEEDS ATTENTION */}
      <Section title="What is moving?">
        {statements.map((s, i) => <StatementRow key={i} s={s} />)}
      </Section>

      {pack && (
        <Section title="What needs attention?" right={<Stamp kind="derived" />}>
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8A5410]">Field intelligence — research artefacts</p>
            <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{pack.local_economy_summary}</p>
            <div className="mt-3 space-y-2">
              {pack.opportunity_domains.map((d) => (
                <div key={d.domain_id} className="rounded-xl border border-[#EED9B8] bg-white p-3">
                  <p className="text-xs font-semibold text-[#241A33]">{d.domain_name} <span className="text-[#8B7FA3]">· confidence {d.confidence} (research)</span></p>
                  <p className="mt-1 text-[11px] text-[#5A4E6D]">{d.rationale}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[11px] text-[#8B7FA3]">
              Source {packProvenance(pack)} · confidence {pack.confidence} · review_required {pack.review_required ? 'true' : 'false'}
              {pack.review_reasons.length ? ` · ${pack.review_reasons.join('; ')}` : ''}. Opportunity notes are context — not verified demand.
            </p>
          </div>
        </Section>
      )}

      {/* OPERATING CELLS — town × initiative */}
      <Section title="Operating cells — town × initiative" right={<Stamp kind="records_not_accessible" />}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {CANONICAL_TEN.map((i) => {
            const cell = buildCell(town, i.key);
            return (
              <Link key={i.key} href={`/operate/town/${town.slug}/${i.key}`}
                className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
                <p className="text-xs font-bold text-[#241A33]">{town.name} × {i.name}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#8A5410]">NOT DEPLOYED (state not accessible)</p>
                <p className="mt-1 text-[10px] text-[#8B7FA3]">
                  {cell.demand.claim === 'DERIVED' ? `${cell.demand.domains.length} opportunity domains (research)` : 'demand: insufficient evidence'}
                  {' · '}{cell.nextActions.items.length ? `${cell.nextActions.items.length} derived next actions` : 'no derived actions'}
                </p>
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-[#8B7FA3]">Deployment state is never fabricated: without accessible deployment records a cell reads NOT DEPLOYED (state not accessible) — it is never shown as planned, active or zero.</p>
      </Section>

      {/* PROOF + ECONOMICS + LEARNING */}
      <Section title="Proof · economics · learning">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <StateBlock title="Proof" body={pack ? `PROOF GAP — the field intelligence defines ${pack.recommended_workpacks.reduce((n, w) => n + w.proof_required.length, 0)} proof standards for this town; captured proofs are protected records (RECORDS NOT ACCESSIBLE).` : 'PROOF GAP — no proof standards and no accessible captured proofs for this town.'} />
          <StateBlock title="Economics" body="NOT YET MEASURED — no economic records are accessible for this town. GMV / revenue / contribution are never rendered as zero." />
          <StateBlock title="Learning" body="ABSENT — the learnings object is absent from the canonical schema (verified). This is not zero: the object genuinely does not exist yet." />
        </div>
      </Section>

      {/* LEGACY NARRATIVE — separate source, never merged */}
      {legacy && (
        <Section title="Legacy public town narrative" right={<Stamp kind="real" />}>
          <div className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
            <p className="text-[11px] text-[#8B7FA3]">
              Separate source: legacy public.towns record (id {legacy.id.slice(0, 8)}…), archetype “{legacy.archetype ?? 'unset'}”, context updated {legacy.context_updated_at?.slice(0, 10) ?? 'unknown'}. Joined by slug — <span className="font-semibold">not merged</span> into the canonical record.
            </p>
            {legacy.context && typeof legacy.context === 'object' && 'notes' in (legacy.context as Record<string, unknown>) ? (
              <p className="mt-3 text-sm leading-relaxed text-[#241A33]">{String((legacy.context as Record<string, unknown>).notes).slice(0, 700)}</p>
            ) : null}
            <p className="mt-2 text-[11px] text-[#8B7FA3]">These notes carry their own research provenance (census/municipal sources). Where figures differ from the canonical record, both are shown — neither is silently chosen.</p>
          </div>
        </Section>
      )}

      <div className="mt-8">
        <CoS context={`Town · ${town.name}`}
          observe={statements.filter((s) => s.kind === 'computed')}
          explain={statements}
          challenge={[statements[statements.length - 1]]}
          coach={[]}
          proposal={pack ? {
            title: 'Activate first workpack',
            detail: `PROPOSAL — PENDING HUMAN APPROVAL: begin "${pack.recommended_workpacks[0]?.title ?? 'first workpack'}" in ${town.name} with proof standards from the field intelligence.`,
            evidence: [pack.pack_id, `proof required: ${pack.recommended_workpacks[0]?.proof_required.join(', ') ?? '—'}`],
          } : undefined} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: `Open ${town.name} × FixEasy — the operating cell`, href: `/operate/town/${town.slug}/fixeasy` },
          { label: 'Open FixEasy in the Portfolio OS', href: '/operate/initiative/fixeasy' },
          { label: 'See the province picture', href: `/operate/province/${(town.province ?? '').toLowerCase().replace(/\s+/g, '-')}` },
        ]} />
      </div>
    </div>
  );
}
