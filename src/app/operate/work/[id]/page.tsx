// src/app/operate/work/[id]/page.tsx — WORK ITEM (the executable unit of the operating loop).
// Journey 1: HOME → MY WORK → WORK ITEM → PROOF → LEARNING → NEXT ACTION.
// Every step is present and honest: standards ≠ evidence, absent ≠ zero, proposals execute nothing.

import Link from 'next/link';
import { getCanonicalTowns, derivedWorkQueue } from '@/lib/e003/os';
import { allWorkItems, workItemById, MISSION_TERMINOLOGY_NOTE, LEARNING_LOOP_NOTE } from '@/lib/e003/loop';
import { Stamp, StateBlock, Section, ContextBar, NextMoves, PlaceholderOwner } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

function LoopSpine({ loop }: { loop: ReturnType<typeof workItemById> extends infer _ ? any : never }) {
  const steps = [
    ['SIGNAL', loop.signal.claim, loop.signal.note],
    ['MISSION', loop.mission.claim, loop.mission.note],
    ['WORK', 'DERIVED', 'This work item — derived from real field-intelligence workpacks.'],
    ['PROOF', loop.proof.claim, loop.proof.note],
    ['LEARNING', loop.learning.claim, loop.learning.note],
    ['OPPORTUNITY', loop.opportunity.claim, loop.opportunity.note],
    ['NEXT MISSION', loop.nextMission.claim, loop.nextMission.note],
  ] as const;
  return (
    <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Operating loop position</p>
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {steps.map(([name], i) => (
          <span key={name} className="flex items-center gap-1.5">
            {i > 0 && <span className="text-[#C9BED6]">→</span>}
            <span className="rounded-full border border-[#D9C7EA] bg-[#F7F1FB] px-2.5 py-1 text-[10px] font-bold text-[#5B2A86]">{name}</span>
          </span>
        ))}
      </div>
      <dl className="mt-4 space-y-2">
        {steps.map(([name, claim, note]) => (
          <div key={name} className="rounded-xl border border-[#F1E8DC] px-3 py-2">
            <dt className="text-[11px] font-bold text-[#241A33]">{name} <span className="ml-1 rounded bg-[#FAF5EE] px-1.5 py-0.5 text-[9px] font-semibold text-[#8A5410]">{claim}</span></dt>
            <dd className="mt-0.5 text-[11px] text-[#5A4E6D]">{note}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export default async function WorkItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const towns = await getCanonicalTowns();
  const items = allWorkItems(towns, derivedWorkQueue(towns));
  const item = workItemById(items, id);

  if (!item) {
    return (
      <div>
        <ContextBar trail={[{ label: 'My Work', href: '/operate/work' }, { label: 'Work item' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">No derivable work item with this id</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5A4E6D]">
          Derived work comes from real field-intelligence workpacks only. If you followed a link to
          an assigned work record: those are protected (RECORDS NOT ACCESSIBLE) and never appear as
          if they existed here. Nothing is invented to fill the page.
        </p>
        <Link href="/operate/work" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Back to My Work</Link>
      </div>
    );
  }

  return (
    <div>
      <ContextBar trail={[{ label: 'My Work', href: '/operate/work' }, { label: 'Work item' }, { label: item.context.town }]} />

      {/* WORK ITEM HEADER */}
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-9 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Work item · derived from field intelligence</p>
        <h1 className="mt-2 max-w-3xl text-2xl font-black sm:text-3xl">{item.what}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Owner</p>
            <p className="mt-1 text-xs font-semibold">Interim · OWNER REQUIRED</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Due</p>
            <p className="mt-1 text-xs font-semibold">RECORDS NOT ACCESSIBLE</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Priority</p>
            <p className="mt-1 text-xs font-semibold">{item.priority} (research-derived)</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#E9DDF5]">Context</p>
            <p className="mt-1 text-xs font-semibold">{item.context.town}</p>
          </div>
        </div>
      </section>

      {/* WHY / WHAT / NEXT */}
      <Section title="Why · what · next">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Why</p>
            <p className="mt-2 text-sm text-[#5A4E6D]">{item.why}</p>
            <p className="mt-2 text-[10px] text-[#8B7FA3]">{item.source}</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Owner &amp; due</p>
            <div className="mt-2 max-w-xs"><PlaceholderOwner role="Town Coordinator" /></div>
            <p className="mt-2 text-[11px] text-[#5A4E6D]">{item.due.note}</p>
          </div>
          <div className="rounded-2xl border border-[#D9B27C] bg-[#FDF3E3] p-5">
            <div className="flex items-start justify-between gap-2">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Next action</p>
              <Stamp kind="derived" />
            </div>
            <p className="mt-2 text-sm font-semibold text-[#241A33]">{item.nextAction}</p>
            <span className="mt-3 inline-block rounded-full border border-[#D9B27C] px-4 py-1.5 text-[11px] font-bold text-[#8A5410]">START — PROPOSAL ONLY (AUTH REQUIRED)</span>
          </div>
        </div>
      </Section>

      {/* PROOF (Journey step) */}
      <div id="proof">
        <Section title="Proof — what would demonstrate this happened">
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Proof standards</p><Stamp kind="authored" /></div>
              <ul className="mt-2 space-y-1">
                {item.evidence.required.map((r) => <li key={r} className="text-xs text-[#241A33]">▸ {r} <span className="text-[#8B7FA3]">(standard — not captured evidence)</span></li>)}
                {!item.evidence.required.length && <li className="text-xs text-[#5A4E6D]">No proof standard stated for this item.</li>}
              </ul>
            </div>
            <StateBlock title="Captured proof" body="RECORDS NOT ACCESSIBLE — captured proofs are protected operational records. PROOF GAP: this work can be described and started, but its proof cannot surface in this experience until authorised access exists." />
          </div>
        </Section>
      </div>

      {/* LEARNING (Journey step) */}
      <div id="learning">
        <Section title="Learning — what this would teach">
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
            <div className="flex items-start justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Learning record</p><Stamp kind="absent" /></div>
            <p className="mt-2 text-xs leading-relaxed text-[#5A4E6D]">{LEARNING_LOOP_NOTE}</p>
          </div>
        </Section>
      </div>

      {/* LOOP SPINE */}
      <Section title="Where this sits in the operating loop">
        <LoopSpine loop={item.loop} />
        <p className="mt-2 text-[10px] text-[#8B7FA3]">{MISSION_TERMINOLOGY_NOTE}</p>
      </Section>

      {/* ACTION — proposal-only */}
      <Section title="Actions">
        <div className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">
            <span className="font-semibold text-[#5B2A86]">START</span> · <span className="font-semibold text-[#5B2A86]">MARK COMPLETE</span> · <span className="font-semibold text-[#5B2A86]">CAPTURE PROOF</span> · <span className="font-semibold text-[#5B2A86]">RAISE BLOCKER</span> · <span className="font-semibold text-[#5B2A86]">PROPOSE NEXT MISSION</span>
            {' '}— every consequential action is PROPOSAL ONLY → HUMAN APPROVAL REQUIRED. Without an
            authenticated, authorised session no state change is possible, and the interface never
            pretends otherwise.
          </p>
        </div>
      </Section>

      <div className="mt-8">
        <CoS context={`Work item · ${item.context.town}`}
          observe={[{
            kind: 'computed',
            text: `This item is research-derived: ${item.what}`,
            evidence: [item.source],
            reasoning: 'Derived from a real workpack recommendation with stated proof standards.',
            limitation: 'DERIVED guidance is not an assignment and carries no due date.',
          }]}
          explain={[{
            kind: 'insufficient_evidence',
            text: 'Progress cannot be evaluated — no captured proof is accessible for this item.',
            evidence: [],
            limitation: 'PROOF GAP. The system refuses to estimate completion.',
          }]}
          challenge={[{
            kind: 'inferred',
            text: 'Assumption to question: that starting the highest-priority workpack is the right first move. The priority is research sequence, not verified local demand — confirm with the town before committing.',
            evidence: [item.source],
            reasoning: 'Research artefacts carry review_required=true.',
          }]}
          coach={[]} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: `Open ${item.context.town} × the initiative cell`, href: `/operate/town/${item.context.townSlug}` },
          { label: 'Back to My Work', href: '/operate/work' },
          { label: 'Open the town signals', href: `/operate/town/${item.context.townSlug}#signals` },
        ]} />
      </div>
    </div>
  );
}
