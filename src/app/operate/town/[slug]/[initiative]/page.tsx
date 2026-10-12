// src/app/operate/town/[slug]/[initiative]/page.tsx — TOWN × INITIATIVE: the core operating
// cell (e.g. SENEKAL × FIXEASY). Every metric carries an evidence contract. Nothing is
// fabricated: protected layers render their honest state.

import Link from 'next/link';
import { getTownBySlug } from '@/lib/e002/real';
import { buildCell, cellMetrics, type OSStatement } from '@/lib/e003/os';
import { initiativeByKey, CANONICAL_TEN } from '@/lib/e003/registry';
import { Stamp, StateBlock, Section, ContextBar, NextMoves, PlaceholderOwner, Metric, ReconciliationChip } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function CellPage({ params }: { params: Promise<{ slug: string; initiative: string }> }) {
  const { slug, initiative: initKey } = await params;
  const town = await getTownBySlug(slug);
  const initiative = initiativeByKey(initKey);

  if (!town || !initiative) {
    return (
      <div>
        <ContextBar trail={[{ label: 'Towns', href: '/operate/national' }, { label: 'Unknown cell' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">This operating cell does not exist</h1>
        <p className="mt-2 text-sm text-[#5A4E6D]">Cells join a canonical database town to a canonical initiative. Nothing is invented for unknown combinations.</p>
        <Link href="/operate/national" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Return to National</Link>
      </div>
    );
  }

  const cell = buildCell(town, initiative.key);
  const metrics = cellMetrics(cell);
  const pack = cell.pack;

  const observe: OSStatement[] = [
    {
      kind: 'computed',
      text: `${town.name} × ${initiative.name}: the town record is real (${town.status ?? 'unset'} / ${town.recruitment_status ?? 'unset'}), the initiative is canonical (${initiative.reconciliation}).`,
      evidence: [town.id, `registry/${initiative.key}`],
      reasoning: 'Cell identity composed from the canonical town record and the Blueprint portfolio registry.',
      limitation: 'Cell identity is not deployment. No deployment records are accessible.',
    },
    pack ? {
      kind: 'authored',
      text: `Field intelligence recommends ${pack.recommended_workpacks.length} workpack(s) and records ${pack.opportunity_domains.length} opportunity domain(s) for ${town.name}.`,
      evidence: [`Field intelligence ${pack.pack_id || '(pack id missing)'} · ${pack.generated_at ? pack.generated_at.slice(0, 10) : '(date missing)'}`],
      reasoning: 'Research artefact summary.',
      limitation: `review_required: ${pack.review_required ? 'true' : 'false'}. Research intelligence is not operational truth.`,
    } : {
      kind: 'insufficient_evidence',
      text: 'No field intelligence exists for this cell — demand and recommended work cannot be assessed here.',
      evidence: [],
      limitation: 'Absence of research artefacts, not absence of opportunity.',
    },
  ];

  return (
    <div>
      <ContextBar trail={[
        { label: 'Towns', href: '/operate/national' },
        { label: town.province ?? '—', href: `/operate/province/${(town.province ?? '').toLowerCase().replace(/\s+/g, '-')}` },
        { label: town.name, href: `/operate/town/${town.slug}` },
        { label: `${town.name} × ${initiative.name}` },
      ]} />

      {/* CELL HEADER — mission-board */}
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-9 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Operating cell · town × initiative</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">{town.name.toUpperCase()} × {initiative.name.toUpperCase()}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Owner</p>
            <p className="mt-1 text-xs font-semibold">Interim · OWNER REQUIRED</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Status</p>
            <p className="mt-1 text-xs font-semibold">NOT DEPLOYED (state not accessible)</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Demand</p>
            <p className="mt-1 text-xs font-semibold">{cell.demand.claim === 'DERIVED' ? `${cell.demand.domains.length} domains (research)` : 'INSUFFICIENT EVIDENCE'}</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Capacity</p>
            <p className="mt-1 text-xs font-semibold">INSUFFICIENT EVIDENCE</p>
          </div>
        </div>
      </section>

      {/* OWNER + RECONCILIATION */}
      <Section title="Ownership & portfolio state">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Cell owner</p>
            <div className="mt-2 max-w-sm"><PlaceholderOwner role={initiative.key === 'fixeasy' ? 'Initiative Head' : 'Town Coordinator'} /></div>
            <p className="mt-2 text-[11px] text-[#5A4E6D]">ASSIGN OWNER is supported as a future action; consequential assignment remains human-approved (PROPOSED — PENDING HUMAN APPROVAL).</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Initiative</p>
            <p className="mt-1 text-sm font-bold text-[#241A33]">{initiative.name}</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">{initiative.purpose ?? 'Canonical purpose not materialized — pending Blueprint source'}</p>
            <div className="mt-2"><ReconciliationChip state={initiative.reconciliation} note={initiative.reconciliationNote} /></div>
          </div>
        </div>
      </Section>

      {/* DEMAND + CAPACITY */}
      <Section title="Demand → supply → gap">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#9DC9B4] bg-[#EDF6F1] p-5">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#2F7D5C]">Demand</p><Stamp kind="derived" /></div>
            {cell.demand.domains.map((d) => (
              <p key={d.domain_id} className="mt-2 text-xs text-[#241A33]"><span className="font-semibold">{d.domain_name}</span> — {d.rationale.slice(0, 120)}… <span className="text-[#8B7FA3]">(confidence {d.confidence}, research)</span></p>
            ))}
            {!cell.demand.domains.length && <p className="mt-2 text-xs text-[#5A4E6D]">{cell.demand.note}</p>}
            <p className="mt-2 text-[10px] text-[#8B7FA3]">{cell.demand.note}</p>
          </div>
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF3E3] p-5">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Supply (capacity)</p><Stamp kind="insufficient_evidence" /></div>
            <p className="mt-2 text-xs text-[#5A4E6D]">{cell.capacity.note}</p>
          </div>
          <div className="rounded-2xl border border-[#E8B4B0] bg-[#FDF1F0] p-5">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A63B33]">Gap</p><Stamp kind="insufficient_evidence" /></div>
            <p className="mt-2 text-xs text-[#5A4E6D]">A capacity gap cannot be computed: demand is research-derived while verified capacity is inaccessible. The system refuses a flattering gap number.</p>
          </div>
        </div>
      </Section>

      {/* WORK + PROOF + LEARNING */}
      <Section title="Work · proof · learning">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Work</p><Stamp kind="derived" /></div>
            {cell.work.recommended.map((w) => (
              <div key={w.workpack_id} className="mt-3 rounded-xl border border-[#F1E8DC] p-3">
                <p className="text-xs font-semibold text-[#241A33]">{w.title} <span className="text-[#8B7FA3]">· priority {w.priority}</span></p>
                <p className="mt-1 text-[11px] text-[#5A4E6D]">{w.why_this_town}</p>
                <p className="mt-1 text-[10px] text-[#8B7FA3]">proof required: {w.proof_required.join(' · ')}</p>
              </div>
            ))}
            <p className="mt-3 text-[10px] text-[#8B7FA3]">{cell.work.assignedNote}</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Proof</p><Stamp kind="records_not_accessible" /></div>
            <p className="mt-2 text-xs text-[#5A4E6D]">{cell.proof.note}</p>
            {cell.proof.required.length > 0 && (
              <ul className="mt-2 space-y-1">
                {cell.proof.required.map((r) => <li key={r} className="text-[11px] text-[#241A33]">▸ {r} <span className="text-[#8B7FA3]">(standard — not captured)</span></li>)}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Learning</p><Stamp kind="absent" /></div>
            <p className="mt-2 text-xs text-[#5A4E6D]">{cell.learning.note}</p>
            <div className="mt-3 rounded-xl border border-[#D9C7EA] bg-[#F7F1FB] p-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#5B2A86]">BMC hypotheses</p>
              <p className="mt-1 text-[11px] text-[#5A4E6D]">Business-model hypotheses for this cell: none authored yet. Blocks read "hypothesis required" — the system never invents assumptions. The initiative BMC is where hypotheses are authored with evidence.</p>
              <Link href={`/operate/initiative/${initiative.key}`} className="mt-1 inline-block text-[11px] font-semibold text-[#5B2A86] hover:underline">open the BMC →</Link>
            </div>
          </div>
        </div>
      </Section>

      {/* ECONOMICS + METRIC CONTRACTS */}
      <Section title="Economics — evidence contracts only">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {metrics.map((m) => <Metric key={m.name} m={m} />)}
        </div>
      </Section>

      {/* NEXT ACTION + RISKS */}
      <Section title="Next action · risks">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#D9B27C] bg-[#FDF3E3] p-5">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Next action</p><Stamp kind="derived" /></div>
            <ol className="mt-3 space-y-2">
              {cell.nextActions.items.map((a, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-[#241A33]">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D9822B] text-[10px] font-black text-white">{i + 1}</span>
                  {a}
                </li>
              ))}
              {!cell.nextActions.items.length && <li className="text-xs text-[#5A4E6D]">No derived next action — no field intelligence for this cell.</li>}
            </ol>
            <p className="mt-3 text-[10px] text-[#8B7FA3]">Source: {cell.nextActions.source}</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Risks & issues</p><Stamp kind={cell.risks.items.length ? 'derived' : 'insufficient_evidence'} /></div>
            <p className="mt-2 text-xs text-[#5A4E6D]">{cell.risks.note}</p>
            {pack && pack.coordinator_strategy && (
              <p className="mt-2 text-[11px] text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Coordinator strategy (research):</span> {pack.coordinator_strategy}</p>
            )}
            {pack && pack.ecosystem_fit.length > 0 && (
              <p className="mt-2 text-[11px] text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Ecosystem fit (research):</span> {pack.ecosystem_fit.map((e) => `${e.entity} (${e.fit_score})`).join(' · ')}</p>
            )}
          </div>
        </div>
      </Section>

      <div className="mt-8">
        <CoS context={`Cell · ${town.name} × ${initiative.name}`}
          observe={observe}
          explain={observe}
          challenge={[{
            kind: 'insufficient_evidence',
            text: 'What am I missing? Deployment, ownership, capacity and economics cannot be evaluated — the underlying records are protected.',
            evidence: [],
            limitation: 'This cell shows research intelligence and canonical identity only. It must not be read as a live deployment report.',
          }]}
          coach={[]}
          proposal={pack ? {
            title: 'Begin first workpack',
            detail: `PROPOSAL — PENDING HUMAN APPROVAL: begin "${pack.recommended_workpacks[0]?.title ?? 'first workpack'}" and capture the stated proof standards.`,
            evidence: [pack.pack_id, `proof: ${pack.recommended_workpacks[0]?.proof_required.join(', ') ?? '—'}`],
          } : undefined} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: `Open ${town.name} — the town`, href: `/operate/town/${town.slug}` },
          { label: `Open ${initiative.name} — initiative workspace`, href: `/operate/initiative/${initiative.key}` },
          { label: 'Open My Work', href: '/operate/work' },
        ]} />
      </div>
    </div>
  );
}
