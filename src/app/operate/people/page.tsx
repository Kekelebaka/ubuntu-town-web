// src/app/operate/people/page.tsx — PEOPLE & CAPABILITY (People OS).
// People are operating objects, not a directory. Real person records are protected — this
// surface shows the OWNERSHIP MAP: what is owned, what is vacant, what cannot be seen.

import Link from 'next/link';
import { getCanonicalTowns, provinceGroups } from '@/lib/e003/os';
import { CANONICAL_TEN } from '@/lib/e003/registry';
import { packForTown } from '@/lib/e003/field-intelligence/packs';
import { Stamp, StateBlock, Section, ContextBar, PlaceholderOwner, NextMoves } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function People() {
  const towns = await getCanonicalTowns();
  const packTowns = towns.filter((t) => packForTown(t.name));

  return (
    <div>
      <ContextBar trail={[{ label: 'People' }]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">People &amp; Capability OS</p>
        <h1 className="mt-2 text-3xl font-black sm:text-4xl">WHO IS BUILDING UBUNTU TOWN?</h1>
        <p className="mt-3 max-w-2xl text-sm text-[#E9DDF5]">
          Evidence moves you. Time served does not. Real person records are protected in the
          canonical system — this surface shows the ownership map honestly: what is owned, what is
          vacant, and what cannot yet be seen.
        </p>
      </section>

      {/* OWNERSHIP MAP */}
      <Section title="Ownership map" right={<Stamp kind="absent" />}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Initiative ownership</p>
            <div className="mt-3 space-y-2">
              {CANONICAL_TEN.map((i) => (
                <div key={i.key} className="flex items-center justify-between gap-3 rounded-xl border border-[#F1E8DC] px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-[#241A33]">{i.name}</p>
                    <p className="text-[10px] text-[#8A5410]">Ubuntu — Interim Initiative Head · OWNER REQUIRED</p>
                  </div>
                  <Link href={`/operate/initiative/${i.key}`} className="text-[10px] font-semibold text-[#5B2A86] hover:underline">open →</Link>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Town coordination — field-intelligence towns</p>
            <div className="mt-3 space-y-2">
              {packTowns.map((t) => (
                <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#F1E8DC] px-3 py-2">
                  <div>
                    <p className="text-xs font-semibold text-[#241A33]">{t.name} <span className="text-[10px] font-normal text-[#8B7FA3]">· {t.province}</span></p>
                    <p className="text-[10px] text-[#8A5410]">Ubuntu — Interim Town Coordinator · OWNER REQUIRED</p>
                  </div>
                  <Link href={`/operate/town/${t.slug}`} className="text-[10px] font-semibold text-[#5B2A86] hover:underline">open →</Link>
                </div>
              ))}
            </div>
            <p className="mt-2 text-[10px] text-[#8B7FA3]">{towns.length} canonical database rows exist; only towns with field intelligence are listed here. Ownership for the rest is equally unconfirmed.</p>
          </div>
        </div>
      </Section>

      {/* PERSON OBJECTS */}
      <Section title="Person objects — vacancy as a real operating object">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/operate/person/interim-initiative-head" className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
            <p className="text-sm font-bold text-[#241A33]">Ubuntu — Interim Initiative Head</p>
            <div className="mt-2"><PlaceholderOwner role="Initiative Head" /></div>
            <p className="mt-2 text-[10px] text-[#8B7FA3]">A vacancy object across the portfolio. Open to see the role, scope and next moves.</p>
          </Link>
          <Link href="/operate/person/interim-town-coordinator" className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
            <p className="text-sm font-bold text-[#241A33]">Ubuntu — Interim Town Coordinator</p>
            <div className="mt-2"><PlaceholderOwner role="Town Coordinator" /></div>
            <p className="mt-2 text-[10px] text-[#8B7FA3]">A vacancy object across the town network.</p>
          </Link>
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Real people</p>
            <p className="mt-2 text-xs leading-relaxed text-[#5A4E6D]">
              REAL person records exist in the canonical system and are visible to authorised,
              authenticated users. They are <span className="font-semibold">RECORDS NOT ACCESSIBLE</span> to
              this experience. No person is invented to fill the gap — not a name, not a photo, not a bio.
            </p>
          </div>
        </div>
      </Section>

      {/* LERATO LAYER */}
      <Section title="People & capability — the operating questions">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StateBlock title="Capability" body="Capability dimensions require evidence chains (work → proof → learning) from protected records — RECORDS NOT ACCESSIBLE. No assessment is invented; the flywheel position of every person is genuinely unknown here." />
          <StateBlock title="Capacity" body="Capacity constraints require work-assignment and time records — RECORDS NOT ACCESSIBLE. The system refuses to rank or score people it cannot see." />
          <StateBlock title="Coaching" body="A meaningful coaching recommendation requires authorised operational evidence. Coaching proposals belong to the People & Capability layer behind authorisation." />
          <StateBlock title="30 / 60 / 90 outcomes" body="Development outcomes require the people-system evidence chain — RECORDS NOT ACCESSIBLE until authorised access exists." />
        </div>
      </Section>

      <div className="mt-8">
        <CoS context="People & Capability"
          observe={[{
            kind: 'computed',
            text: `Ownership is unconfirmed across all ${CANONICAL_TEN.length} canonical initiatives and the ${packTowns.length} field-intelligence towns — every ownership slot renders as an interim vacancy.`,
            evidence: ['canonical registry', 'field-intelligence packs'],
            reasoning: 'No accessible person/role records resolve any ownership slot.',
            limitation: 'Unconfirmed ownership is not absent people — real person records are protected.',
          }]}
          explain={[{
            kind: 'insufficient_evidence',
            text: 'Capability, capacity and development cannot be evaluated without authorised people-system evidence.',
            evidence: [],
            limitation: 'RECORDS NOT ACCESSIBLE. This is a successful system state, not a failure.',
          }]}
          challenge={[]} coach={[]} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'Open a vacancy object — Interim Initiative Head', href: '/operate/person/interim-initiative-head' },
          { label: 'Open My Work', href: '/operate/work' },
          { label: 'Open the Portfolio OS', href: '/operate/initiatives' },
        ]} />
      </div>
    </div>
  );
}
