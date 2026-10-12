// src/app/operate/person/[id]/page.tsx — PERSON (People OS): "Here is what I own."
// Vacancy objects are real operating objects (real_person=false). Real person records render
// only for authorised sessions — here, honestly: RECORDS NOT ACCESSIBLE. Never a fake human.

import Link from 'next/link';
import { CANONICAL_TEN } from '@/lib/e003/registry';
import { packForTown } from '@/lib/e003/field-intelligence/packs';
import { getCanonicalTowns } from '@/lib/e003/os';
import { Stamp, StateBlock, Section, ContextBar, PlaceholderOwner, NextMoves } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

const VACANCIES: Record<string, { role: string; scope: string; responsibilities: string[] }> = {
  'interim-initiative-head': {
    role: 'Initiative Head',
    scope: 'One canonical initiative (assigned at appointment)',
    responsibilities: [
      'Own the initiative operating model and the Business Model Canvas',
      'Own town deployments and their operating cells',
      'Own work standards and proof standards',
      'Own economics measurement where supported',
    ],
  },
  'interim-town-coordinator': {
    role: 'Town Coordinator',
    scope: 'One town (assigned at appointment)',
    responsibilities: [
      'Operate the town across its initiative cells',
      'Coordinate people, work and proof in the town',
      'Report movement and risk with evidence',
      'Develop local capability',
    ],
  },
};

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vacancy = VACANCIES[id];
  const towns = await getCanonicalTowns();
  const packTowns = towns.filter((t) => packForTown(t.name));

  if (!vacancy) {
    return (
      <div>
        <ContextBar trail={[{ label: 'People', href: '/operate/people' }, { label: 'Person' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">Person record — RECORDS NOT ACCESSIBLE</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#5A4E6D]">
          Real person records exist in the canonical system and are visible to authorised,
          authenticated users. This experience does not resolve person identities — and never
          fabricates one. The vacancy objects are the person objects visible here.
        </p>
        <Link href="/operate/people" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Open the ownership map</Link>
      </div>
    );
  }

  return (
    <div>
      <ContextBar trail={[{ label: 'People', href: '/operate/people' }, { label: `Ubuntu — Interim ${vacancy.role}` }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Person object · vacancy</p>
        <h1 className="mt-2 text-3xl font-black">UBUNTU — INTERIM {vacancy.role.toUpperCase()}</h1>
        <div className="mt-3 max-w-md"><PlaceholderOwner role={vacancy.role} /></div>
        <p className="mt-3 text-xs text-[#E9DDF5]">Scope: {vacancy.scope} · This is a genuine vacancy/ownership object — never a fabricated person.</p>
      </section>

      {/* WHO / WHERE / WHAT THEY OWN */}
      <Section title="Who · where · what they own">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Who</p>
            <p className="mt-1 text-sm font-semibold text-[#241A33]">Ubuntu — Interim {vacancy.role}</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">real_person=false · appointment_status=VACANT · placeholder=true</p>
            <p className="mt-2 text-[11px] text-[#5A4E6D]"><span className="font-semibold">Role status:</span> PENDING APPOINTMENT</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Where</p>
            <p className="mt-1 text-xs text-[#5A4E6D]">{vacancy.scope}</p>
            <p className="mt-2 text-[11px] text-[#5A4E6D]">National · Province · Town · Initiative — the scope is assigned at appointment, never assumed.</p>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Responsibilities</p>
            <ul className="mt-2 space-y-1">
              {vacancy.responsibilities.map((r) => <li key={r} className="text-[11px] text-[#5A4E6D]">▸ {r}</li>)}
            </ul>
          </div>
        </div>
      </Section>

      {/* WHAT THEY'RE DOING / LEARNING / PROVED */}
      <Section title="Doing · learning · proved">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <StateBlock title="What are they doing?" body="Work, actions and missions for this role: RECORDS NOT ACCESSIBLE (protected). The vacancy object carries its next moves instead of invented activity." />
          <StateBlock title="What are they learning?" body="Capability gaps, learning and coaching require the people-system evidence chain — RECORDS NOT ACCESSIBLE." />
          <StateBlock title="What have they proved?" body="Evidence and outcomes: PROOF GAP — no proof chain can exist for an unappointed role. This is expected, not failure." />
        </div>
      </Section>

      {/* WHAT LERATO SEES */}
      <Section title="What the People & Capability layer sees">
        <div className="rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">
            <span className="font-semibold text-[#5B2A86]">Ownership:</span> this role is unowned across {CANONICAL_TEN.length} initiatives / {packTowns.length} field-intelligence towns (role-dependent).
            <span className="font-semibold text-[#5B2A86]"> Capability / capacity / 30-60-90:</span> RECORDS NOT ACCESSIBLE until appointment and authorised access.
            <span className="font-semibold text-[#5B2A86]"> Recruitment need:</span> real — every vacancy object is a live recruitment requirement with evidence (the vacancy is the evidence).
          </p>
        </div>
      </Section>

      <div className="mt-8">
        <CoS context={`Person · Ubuntu — Interim ${vacancy.role}`}
          observe={[{
            kind: 'computed',
            text: `This is a vacancy object: appointment_status=VACANT, real_person=false. It exists so ownership gaps are visible and actionable.`,
            evidence: ['ownership map'],
            reasoning: 'Derived from the absence of any accessible appointment record for this role.',
            limitation: 'A vacancy is not proof that no suitable person exists — it is proof that ownership is unconfirmed in the system.',
          }]}
          explain={[{
            kind: 'insufficient_evidence',
            text: 'Development guidance for this role cannot be generated — there is no person to develop until a human appoints one.',
            evidence: [],
            limitation: 'RECORDS NOT ACCESSIBLE. The coaching layer refuses to invent an assessment.',
          }]}
          challenge={[]}
          coach={[]}
          proposal={{
            title: 'ASSIGN OWNER',
            detail: 'PROPOSAL — PENDING HUMAN APPROVAL: appoint a verified person to this role. Consequential assignment remains human-approved and is never executed by the system.',
            evidence: ['vacancy object (the evidence of the gap)'],
          }} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Open the ownership map', href: '/operate/people' },
          { label: 'Open My Work', href: '/operate/work' },
          { label: 'Open the Portfolio OS', href: '/operate/initiatives' },
        ]} />
      </div>
    </div>
  );
}
