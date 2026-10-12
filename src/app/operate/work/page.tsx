// src/app/operate/work/page.tsx — MY WORK (Personal execution OS): a workbench, not a report.
// Real derivable work from field intelligence + honest protected state for assigned work.
// Actions are permission-gated proposals; nothing consequential executes.

import Link from 'next/link';
import { getCanonicalTowns, derivedWorkQueue } from '@/lib/e003/os';
import { packForTown, FIELD_PACKS } from '@/lib/e003/field-intelligence/packs';
import { Stamp, StateBlock, Section, ContextBar, NextMoves, PlaceholderOwner } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function MyWork() {
  const towns = await getCanonicalTowns();
  const queue = derivedWorkQueue(towns);
  const byTown = new Map<string, typeof queue>();
  for (const w of queue) {
    if (!byTown.has(w.context.town)) byTown.set(w.context.town, []);
    byTown.get(w.context.town)!.push(w);
  }

  return (
    <div>
      <ContextBar trail={[{ label: 'My Work' }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Personal execution OS</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">MY WORK</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">
          NEEDS ME · DUE · BLOCKED · WAITING · PROOF REQUIRED · LEARNING · NEXT.
          What you can act on now: real, derived work guidance from field intelligence. What is
          assigned to you by a person: RECORDS NOT ACCESSIBLE in this session.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">{queue.length} derived work items</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{byTown.size} towns with workpack guidance</span>
          <span className="rounded-full border border-[#F5C97E] px-3 py-1 text-[#F5C97E]">assigned work: RECORDS NOT ACCESSIBLE</span>
        </div>
      </section>

      {/* NEEDS ME — the workbench */}
      <Section title="Needs me — derived work guidance" right={<Stamp kind="derived" />}>
        <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <ul className="divide-y divide-[#F1E8DC]">
            {queue.map((w) => (
              <li key={w.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-3xl">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-[#241A33]">{w.what}</p>
                      <Stamp kind="derived" />
                    </div>
                    <p className="mt-1 text-xs text-[#5A4E6D]"><span className="font-semibold text-[#241A33]">Why:</span> {w.why}</p>
                    <div className="mt-1.5 grid grid-cols-1 gap-x-6 gap-y-0.5 text-[11px] text-[#8B7FA3] sm:grid-cols-2">
                      <p><span className="font-semibold text-[#241A33]">Owner:</span> interim · OWNER REQUIRED</p>
                      <p><span className="font-semibold text-[#241A33]">Context:</span> {w.context.town}</p>
                      <p><span className="font-semibold text-[#241A33]">Evidence required:</span> {w.evidence.join(' · ') || '—'}</p>
                      <p><span className="font-semibold text-[#241A33]">Source:</span> {w.source}</p>
                    </div>
                    <p className="mt-1.5 text-xs text-[#5B2A86]"><span className="font-semibold">Next action:</span> {w.nextAction}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Link href={`/operate/work/${w.id.replace(/^wk:/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`} className="rounded-full border border-[#D9C7EA] px-3 py-1 text-[11px] font-semibold text-[#5B2A86] hover:bg-[#F3EBFA]">open work item</Link>
                    <Link href={`/operate/town/${w.context.town.toLowerCase().replace(/\s+/g, '-')}`} className="rounded-full border border-[#EADFD2] px-3 py-1 text-[10px] font-semibold text-[#8B7FA3] hover:bg-[#FAF5EE]">open context</Link>
                    <span className="rounded-full border border-[#E7C9A0] px-3 py-1 text-[10px] font-bold text-[#8A5410]">START — PROPOSAL ONLY</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-2 text-[11px] text-[#8B7FA3]">
          Every action button reads PROPOSAL ONLY: without an authenticated, authorised session no state change is possible and none is simulated as real.
        </p>
      </Section>

      {/* ASSIGNED / DUE / BLOCKED / WAITING / PROOF REQUIRED */}
      <Section title="Assigned · due · blocked · waiting · proof required">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StateBlock title="Assigned to me" body="RECORDS NOT ACCESSIBLE — assignment records are protected. Assigned work will render here for an authorised session; it is never fabricated for demonstration." />
          <StateBlock title="Due · blocked · waiting" body="RECORDS NOT ACCESSIBLE — due dates, blockers and waiting states live in protected work records. No timeline is invented." />
          <StateBlock title="Proof required" body={`PROOF GAP — field intelligence states ${FIELD_PACKS.reduce((n, p) => n + p.recommended_workpacks.reduce((m, w) => m + w.proof_required.length, 0), 0)} proof standards across the network; captured proofs are protected. Standards are not evidence.`} />
          <StateBlock title="Learning" body="ABSENT — the learnings object is absent from the canonical schema (verified). Completed work cannot yet feed a learning record — a known, documented gap (G3)." />
        </div>
      </Section>

      {/* WORK SPINE */}
      <Section title="The work spine — where completed work goes">
        <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#241A33]">
            {['WORK', 'PROOF', 'OUTCOME', 'LEARNING', 'CAPABILITY', 'NEXT ACTION'].map((s, i) => (
              <span key={s} className="flex items-center gap-2">
                {i > 0 && <span className="text-[#C9BED6]">→</span>}
                <span className="rounded-full border border-[#D9C7EA] bg-[#F7F1FB] px-3 py-1.5">{s}</span>
              </span>
            ))}
          </div>
          <p className="mt-3 text-xs text-[#5A4E6D]">
            A completed work item never silently disappears — it feeds proof, memory, learning and capability.
            In this build, the PROOF and LEARNING links render honest gap states (protected / absent) rather than fake completions.
          </p>
        </div>
      </Section>

      <div className="mt-8">
        <CoS context="My Work · personal execution"
          observe={[{
            kind: 'computed',
            text: `${queue.length} derivable work items exist across ${byTown.size} towns, from real field-intelligence workpack recommendations.`,
            evidence: ['field-intelligence packs (10 towns)'],
            reasoning: 'Workpack recommendations carry title, why-this-town, priority and proof standards in the research artefacts.',
            limitation: 'DERIVED guidance is not assignment. Assigned work requires protected records (RECORDS NOT ACCESSIBLE).',
          }]}
          explain={[{
            kind: 'insufficient_evidence',
            text: 'What you should personally do next cannot be prioritised without knowing your role and assignments — both are inaccessible in this session.',
            evidence: [],
            limitation: 'The system refuses to guess your priorities. Confirm your role through an authorised session first.',
          }]}
          challenge={[]} coach={[]} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Open Senekal × FixEasy — act inside a cell', href: '/operate/town/senekal/fixeasy' },
          { label: 'Open People & Capability — ownership gaps', href: '/operate/people' },
          { label: 'Open the Geography OS', href: '/operate/national' },
        ]} />
      </div>
    </div>
  );
}
