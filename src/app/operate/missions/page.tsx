// src/app/operate/missions/page.tsx — MISSIONS (CAMPAIGN TARGETS) — the honest object surface.
// Contradiction D-01 resolved at the experience layer: uto.missions = campaign targets
// (target_count × cadence, progress derived from community_work), NOT work items. Schema untouched.

import Link from 'next/link';
import { StateBlock, Section, ContextBar, Stamp, NextMoves } from '@/components/e003/os-ui';
import { MISSION_TERMINOLOGY_NOTE, LEARNING_LOOP_NOTE, nextMissionProposals, type MissionProposal } from '@/lib/e003/loop';
import { getCanonicalTowns } from '@/lib/e003/os';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function MissionsPage() {
  const towns = await getCanonicalTowns();
  const proposals = nextMissionProposals(towns);

  return (
    <div>
      <ContextBar trail={[{ label: 'My Work', href: '/operate/work' }, { label: 'Missions' }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Operating loop · signal → mission → work</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">MISSIONS</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">
          Two objects share the word “mission”. This screen keeps them apart instead of
          pretending the schema says something it does not.
        </p>
      </section>

      {/* TERMINOLOGY RESOLUTION — the contradiction, worn openly */}
      <Section title="Terminology resolution (contradiction D-01)" right={<Stamp kind="contradiction" />}>
        <div className="rounded-2xl border border-[#E8B4B0] bg-[#FDF1F0] p-5">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">{MISSION_TERMINOLOGY_NOTE}</p>
        </div>
      </Section>

      {/* CAMPAIGN TARGETS */}
      <Section title="Mission (campaign target) — uto.missions">
        <StateBlock title="Campaign targets" body="RECORDS NOT ACCESSIBLE — uto.missions rows are visible to authenticated users (RLS: missions_read for authenticated). This public experience cannot list active campaigns. What is known from the schema (migration 0011): a campaign target has target_count × cadence (daily | weekly | once), optionally scoped to a town and work type, with progress DERIVED from community work counts — never stored as a score." />
        <div className="mt-3 rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Community work (the progress source)</p>
          <p className="mt-2 text-xs leading-relaxed text-[#5A4E6D]">
            uto.community_work is publicly readable and returned 0 rows to this experience — but
            row-level security can filter visibility by consent and tenancy. Therefore the correct
            state is <span className="font-semibold text-[#241A33]">INSUFFICIENT EVIDENCE</span> for
            “no community work exists”, and <span className="font-semibold text-[#241A33]">ZERO
            (visible to this experience)</span> for what this read can see. Those are different
            claims and the system keeps them apart.
          </p>
        </div>
      </Section>

      {/* PROPOSED MISSIONS — the operating-loop sense */}
      <Section title="Proposed missions — the operating-loop sense" right={<Stamp kind="derived" />}>
        <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">
            In the operating loop (SIGNAL → MISSION → WORK → PROOF → LEARNING → OPPORTUNITY →
            NEXT MISSION), a mission is what a signal becomes when a human decides to act on it.
            Below are mission candidates derived from real recorded signals — every one is a
            PROPOSAL awaiting human approval. None executes.
          </p>
        </div>
        <ul className="mt-3 space-y-2">
          {proposals.map((p: MissionProposal) => (
            <li key={p.id} className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-[#241A33]">{p.title}</p>
                <span className="rounded-full border border-[#D9B27C] px-3 py-1 text-[10px] font-bold text-[#8A5410]">PROPOSED — PENDING HUMAN APPROVAL</span>
              </div>
              <p className="mt-1 text-xs text-[#5A4E6D]">{p.why}</p>
              <p className="mt-1 text-[10px] text-[#8B7FA3]">Signal: {p.evidence.join(' · ')}</p>
            </li>
          ))}
        </ul>
      </Section>

      {/* LEARNING link in the loop */}
      <Section title="What completed missions would feed">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StateBlock title="Proof" body="Mission completion is proven through the work's proof standards (see work items). Captured proofs are protected — PROOF GAP." />
          <StateBlock title="Learning" body={LEARNING_LOOP_NOTE} />
        </div>
      </Section>

      <div className="mt-8">
        <CoS context="Missions · campaign targets + loop proposals"
          observe={[{
            kind: 'authored',
            text: 'Two distinct objects share the word "mission": schema campaign targets (uto.missions) and the operating-loop mission (signal → decided action). This surface keeps them apart on purpose.',
            evidence: ['migration 0011 (uto.missions schema)', 'operating loop doctrine'],
            reasoning: 'Terminology conflict resolved at the experience layer; the schema is untouched (per the mandate: do not silently rewrite the schema).',
          }]}
          challenge={[{
            kind: 'inferred',
            text: 'A campaign target can be "complete" while the town still needs the thing the campaign was for. Do not confuse target-count completion with mission success.',
            evidence: ['uto.my_missions derives progress from community_work counts'],
            reasoning: 'Counted completion measures activity, not outcome.',
          }]}
          explain={[]} coach={[]} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Open My Work', href: '/operate/work' },
          { label: 'Open the town signals', href: '/operate/town/senekal#signals' },
          { label: 'Open Senekal × FixEasy', href: '/operate/town/senekal/fixeasy' },
        ]} />
      </div>
    </div>
  );
}
