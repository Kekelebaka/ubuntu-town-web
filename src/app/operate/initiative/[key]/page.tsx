// src/app/operate/initiative/[key]/page.tsx — INITIATIVE workspace (Portfolio OS).
// Shared operating grammar for all ten engines. BMC = living object (hypothesis → evidence →
// status → experiment → learning), never a static canvas. Purpose is never rewritten.

import Link from 'next/link';
import { getCanonicalTowns, buildCell } from '@/lib/e003/os';
import { initiativeByKey, CANONICAL_TEN, type CanonicalInitiative } from '@/lib/e003/registry';
import { packForTown } from '@/lib/e003/field-intelligence/packs';
import { Stamp, StateBlock, Section, ContextBar, StatementRow, NextMoves, PlaceholderOwner, ReconciliationChip } from '@/components/e003/os-ui';
import { initiativeStatements } from '@/lib/e003/os';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

const BMC_BLOCKS = [
  ['Customer Segments', 'Who this engine serves in a town economy.'],
  ['Value Proposition', 'The change this engine creates for those segments.'],
  ['Channels', 'How the engine reaches its segments.'],
  ['Customer Relationships', 'How the engine earns trust and repeat participation.'],
  ['Revenue Streams', 'How the engine earns (economics: NOT YET MEASURED where unsupported).'],
  ['Key Resources', 'People, tools, places and data the engine needs.'],
  ['Key Activities', 'The recurring operating work of the engine.'],
  ['Key Partners', 'Ecosystem partners (e.g. recorded ecosystem fit in field intelligence).'],
  ['Cost Structure', 'What the engine costs to operate (economics: NOT YET MEASURED where unsupported).'],
] as const;

export default async function InitiativePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const initiative = initiativeByKey(key);
  if (!initiative) {
    return (
      <div>
        <ContextBar trail={[{ label: 'Initiatives', href: '/operate/initiatives' }, { label: 'Unknown initiative' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">Not a canonical initiative</h1>
        <p className="mt-2 text-sm text-[#5A4E6D]">The portfolio is exactly the ten canonical engines. A database row does not become an approved initiative merely by existing.</p>
        <Link href="/operate/initiatives" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Open the Portfolio OS</Link>
      </div>
    );
  }

  const towns = await getCanonicalTowns();
  const statements = initiativeStatements(initiative);
  const packTowns = towns.filter((t) => packForTown(t.name));

  return (
    <div>
      <ContextBar trail={[{ label: 'Initiatives', href: '/operate/initiatives' }, { label: initiative.name }]} />

      {/* HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Portfolio OS · canonical initiative</p>
        <h1 className="mt-2 text-4xl font-black">{initiative.name.toUpperCase()}</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">{initiative.purpose ?? 'Canonical Blueprint purpose not materialized in this estate — it is not invented here.'}</p>
        <div className="mt-4 max-w-md"><PlaceholderOwner role="Initiative Head" /></div>
        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">operating state: PLANNED (no accessible deployment records)</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{packTowns.length} towns carry field intelligence</span>
        </div>
      </section>

      {/* WHY THIS EXISTS + RECONCILIATION */}
      <Section title="Why this exists">
        {statements.map((s, i) => <StatementRow key={i} s={s} />)}
        <div className="mt-3"><ReconciliationChip state={initiative.reconciliation} note={initiative.reconciliationNote} /></div>
      </Section>

      {/* BUSINESS MODEL CANVAS — living */}
      <Section title="Business model canvas — living" right={<Stamp kind="authored" />}>
        <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-4">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">
            <span className="font-semibold text-[#8A5410]">Operating loop:</span> BUSINESS MODEL → HYPOTHESIS → EXPERIMENT → WORK → EVIDENCE → RESULT → LEARNING → BMC UPDATE → NEXT EXPERIMENT.
            Each block below is an operating object: HYPOTHESIS → EVIDENCE → STATUS → EXPERIMENT → LEARNING. Hypotheses are never invented — empty blocks read "hypothesis required".
          </p>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {BMC_BLOCKS.map(([block, shape]) => (
            <div key={block} className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-bold text-[#241A33]">{block}</p>
                <Stamp kind="insufficient_evidence" />
              </div>
              <p className="mt-1 text-[10px] text-[#8B7FA3]">{shape}</p>
              <div className="mt-3 space-y-1.5 text-[11px]">
                <p className="rounded-lg border border-[#EED9B8] bg-[#FDF9F1] px-2.5 py-1.5 text-[#8A5410]"><span className="font-semibold">Hypothesis:</span> required — not yet authored</p>
                <p className="text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Evidence:</span> none linked</p>
                <p className="text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Status:</span> ASSUMED (untested)</p>
                <p className="text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Experiment:</span> none proposed</p>
                <p className="text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Learning:</span> —</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* TOWN DEPLOYMENTS */}
      <Section title="Town deployments — the operating cells">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {packTowns.map((t) => {
            const cell = buildCell(t, initiative.key);
            return (
              <Link key={t.id} href={`/operate/town/${t.slug}/${initiative.key}`}
                className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
                <p className="text-xs font-bold text-[#241A33]">{t.name} × {initiative.name}</p>
                <p className="mt-1 text-[10px] font-semibold text-[#8A5410]">NOT DEPLOYED (state not accessible)</p>
                <p className="mt-1 text-[10px] text-[#8B7FA3]">{cell.demand.claim === 'DERIVED' ? `${cell.demand.domains.length} domains · ${cell.nextActions.items.length} derived actions` : 'insufficient evidence'}</p>
              </Link>
            );
          })}
        </div>
        <p className="mt-2 text-[11px] text-[#8B7FA3]">Showing towns with field intelligence ({packTowns.length}). All 81 canonical database rows could host a cell; deployment state is never fabricated for any of them.</p>
      </Section>

      {/* WORK / PROOF / LEARNING / ECONOMICS / OPPORTUNITIES */}
      <Section title="Work · proof · learning · economics">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StateBlock title="Work" body="Work assigned to people for this initiative: RECORDS NOT ACCESSIBLE (protected). Derivable work guidance exists per town through field-intelligence workpacks — open a deployment cell." />
          <StateBlock title="Proof" body="PROOF GAP — captured proofs are protected records. Field intelligence states proof standards per workpack; standards are not evidence." />
          <StateBlock title="Learning" body="ABSENT — the learnings object is absent from the canonical schema (verified). This initiative's learning loop cannot yet record; the BMC operating loop documents what would fill it." />
          <StateBlock title="Economics" body="GMV · Ubuntu Town revenue · direct cost · contribution · town operating cost · operating result · reinvestment: NOT YET MEASURED. No economic value is invented; the metric contracts define exactly what will be measured when records exist." />
        </div>
      </Section>

      <div className="mt-8">
        <CoS context={`Initiative · ${initiative.name}`}
          observe={statements.filter((s) => s.kind === 'computed' || s.kind === 'authored')}
          explain={statements}
          challenge={[statements[2]]}
          coach={[]}
          proposal={{
            title: 'Author the first BMC hypothesis',
            detail: `PROPOSAL — PENDING HUMAN APPROVAL: author the Value Proposition hypothesis for ${initiative.name} and design the first experiment (INCUBATOR loop).`,
            evidence: initiative.purpose ? [`purpose: ${initiative.purpose}`] : ['purpose: not materialized'],
          }} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: `Open ${initiative.name} × Senekal — the operating cell`, href: `/operate/town/senekal/${initiative.key}` },
          { label: 'Open My Work', href: '/operate/work' },
          { label: 'Back to the Portfolio OS', href: '/operate/initiatives' },
        ]} />
      </div>
    </div>
  );
}
