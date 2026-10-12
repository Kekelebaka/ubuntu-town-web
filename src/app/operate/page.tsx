// src/app/operate/page.tsx — HOME: the user's operating cockpit (personal, not a dashboard).
// Public session reality: role = none assigned (honest), world = real geography + portfolio,
// work = real derived queue from field intelligence, protected layers = RECORDS NOT ACCESSIBLE.

import Link from 'next/link';
import { getCanonicalTowns, provinceGroups, geographyDeltas, derivedWorkQueue, nationalStatements, type CanonicalTown } from '@/lib/e003/os';
import { CANONICAL_TEN, RECONCILIATION_SUMMARY } from '@/lib/e003/registry';
import { packForTown, FIELD_PACKS } from '@/lib/e003/field-intelligence/packs';
import { whatChanged, LEARNING_LOOP_NOTE } from '@/lib/e003/loop';
import { Stamp, StateBlock, Section, ContextBar, NextMoves, PlaceholderOwner } from '@/components/e003/os-ui';
import CoS from '@/components/e003/CoS';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const towns = await getCanonicalTowns();
  const provinces = provinceGroups(towns);
  const deltas = geographyDeltas(towns, 30);
  const queue = derivedWorkQueue(towns);
  const changed = whatChanged(towns, 30);
  const statements = nationalStatements(towns);
  const packTowns = FIELD_PACKS.map((p) => ({ pack: p, town: towns.find((t) => t.name === p.town) })).filter((x) => x.town);

  return (
    <div>
      <ContextBar trail={[{ label: 'Home' }]} />

      {/* A. ORIENTATION — YOUR WORLD */}
      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-10 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Your world</p>
        <h1 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">GOOD MORNING.<br />HERE IS WHAT MATTERS NOW.</h1>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E9DDF5]">Role</p>
            <p className="mt-1 text-sm font-semibold">Public visitor — no role assigned to this session</p>
            <p className="mt-1 text-[11px] text-[#E9DDF5]">Role assignments are protected records. No role is assumed and no permission is implied.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E9DDF5]">Scope</p>
            <p className="mt-1 text-sm font-semibold">Public operating layer</p>
            <p className="mt-1 text-[11px] text-[#E9DDF5]">50 Blueprint towns · 9 provinces · 10 canonical initiatives · database coverage: 81 canonical rows</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#E9DDF5]">What matters now</p>
            <p className="mt-1 text-sm font-semibold">{RECONCILIATION_SUMMARY.possibleUnresolved + RECONCILIATION_SUMMARY.dbAbsent} canonical initiatives need portfolio reconciliation</p>
            <p className="mt-1 text-[11px] text-[#E9DDF5]">Computed from the registry reconciliation — a governance decision awaits a human.</p>
          </div>
        </div>
      </section>

      {/* B. ATTENTION STREAM */}
      <Section title="Needs attention" right={<Stamp kind="computed" />}>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-[#E8B4B0] bg-[#FDF1F0] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#A63B33]">Decision required</p>
            <p className="mt-2 text-sm font-semibold text-[#241A33]">Portfolio reconciliation (C-01): Daycare/DaycareOS and Ubuntu Socials/Buntu Bar remain UNRESOLVED; {RECONCILIATION_SUMMARY.dbOnly} database rows are portfolio-unreconciled.</p>
            <p className="mt-2 text-xs text-[#5A4E6D]">Why: registry reconciliation against live catalog rows. Evidence: public.initiatives (12 rows) vs canonical ten. A Supabase row does not become canonical by existing.</p>
            <Link href="/operate/initiatives" className="mt-2 inline-block text-xs font-semibold text-[#A63B33] hover:underline">open the portfolio →</Link>
          </div>
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Ownership gap</p>
            <p className="mt-2 text-sm font-semibold text-[#241A33]">Initiative heads and town coordinators are unconfirmed across the portfolio — every ownership slot renders as an interim vacancy.</p>
            <p className="mt-2 text-xs text-[#5A4E6D]">Why: no accessible person/role records (RECORDS NOT ACCESSIBLE). Placeholders are operating objects with next actions — never invented people.</p>
            <Link href="/operate/people" className="mt-2 inline-block text-xs font-semibold text-[#8A5410] hover:underline">open People &amp; Capability →</Link>
          </div>
          <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Proof gap</p>
            <p className="mt-2 text-sm font-semibold text-[#241A33]">Field intelligence defines proof requirements ({FIELD_PACKS.reduce((n, p) => n + p.recommended_workpacks.reduce((m, w) => m + w.proof_required.length, 0), 0)} standards) but no captured proof is accessible.</p>
            <p className="mt-2 text-xs text-[#5A4E6D]">Why: workpack proof_required lists are real research artefacts; captured proofs are protected records. PROOF GAP — not failure, not zero.</p>
            <Link href="/operate/work" className="mt-2 inline-block text-xs font-semibold text-[#8A5410] hover:underline">open My Work →</Link>
          </div>
        </div>
      </Section>

      {/* B2. WHAT CHANGED */}
      <Section title="What changed" right={<Stamp kind="computed" />}>
        <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">{changed.note}</p>
          {changed.items.length > 0 && (
            <ul className="mt-3 space-y-2">
              {changed.items.map((c) => (
                <li key={c.object} className="rounded-xl border border-[#F1E8DC] px-3 py-2">
                  <p className="text-xs font-semibold text-[#241A33]">{c.object} <span className="text-[#8B7FA3]">· {c.since}</span></p>
                  <p className="mt-0.5 text-[11px] text-[#5A4E6D]">{c.change} {c.why} <span className="text-[#8B7FA3]">Evidence: {c.evidence}</span></p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-2 text-[10px] text-[#8B7FA3]">CHANGE HISTORY NOT YET AVAILABLE at object level — this system will not manufacture a delta from a timestamp.</p>
        </div>
      </Section>

      {/* B3. WHAT DID I LEARN */}
      <Section title="What did I learn">
        <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A5410]">Learning feed</p>
            <Stamp kind="absent" />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-[#5A4E6D]">{LEARNING_LOOP_NOTE}</p>
        </div>
      </Section>

      {/* B4. WHAT SHOULD HAPPEN NEXT */}
      <Section title="What should happen next" right={<Stamp kind="derived" />}>
        <div className="rounded-2xl border border-[#D9B27C] bg-[#FDF3E3] p-5">
          <p className="text-sm font-semibold text-[#241A33]">
            {queue[0]?.nextAction ?? 'No derivable next action exists in accessible records.'}
          </p>
          <p className="mt-1 text-[11px] text-[#5A4E6D]">
            {queue[0] ? `From: ${queue[0].what} (${queue[0].context.town}) — research-derived guidance, not an assignment.` : 'INSUFFICIENT EVIDENCE.'}
          </p>
          {queue[0] && (
            <Link href={`/operate/work/${queue[0].id.replace(/^wk:/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
              className="mt-3 inline-block rounded-full bg-[#D9822B] px-5 py-2.5 text-sm font-semibold text-white">
              Open this work item →
            </Link>
          )}
        </div>
      </Section>

      {/* C. YOUR WORK */}
      <Section title="Your work" right={<Stamp kind="derived" />}>
        <div className="overflow-hidden rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <ul className="divide-y divide-[#F1E8DC]">
            {queue.slice(0, 5).map((w) => (
              <li key={w.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#241A33]">{w.what}</p>
                    <p className="mt-0.5 text-xs text-[#5A4E6D]">{w.why}</p>
                    <p className="mt-1 text-[11px] text-[#8B7FA3]">{w.context.town} · {w.source} · proof required: {w.evidence.join(', ') || '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Link href={`/operate/work/${w.id.replace(/^wk:/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`} className="text-xs font-semibold text-[#5B2A86] hover:underline">open work item →</Link>
                    <Link href={`/operate/town/${w.context.town.toLowerCase().replace(/\s+/g, '-')}`} className="text-[11px] text-[#8B7FA3] hover:underline">open context</Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StateBlock title="Assigned work" body="Work assigned to you by a person: RECORDS NOT ACCESSIBLE. Assignment records are protected in the canonical system. The queue above is DERIVED from real field-intelligence workpack recommendations — it is guidance, not assignment." />
          <StateBlock title="Your development" body="Capability, coaching and 30/60/90 outcomes require authorised people-system evidence — RECORDS NOT ACCESSIBLE. The People & Capability layer refuses to invent assessments." action={{ label: 'open People & Capability', href: '/operate/people' }} />
        </div>
      </Section>

      {/* D. YOUR WORLD — towns & initiatives */}
      <Section title="Your towns">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {packTowns.map(({ pack, town }) => (
            <Link key={pack.pack_id} href={`/operate/town/${town!.slug}`}
              className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <p className="text-sm font-bold text-[#241A33]">{town!.name}</p>
              <p className="mt-1 text-[11px] text-[#8B7FA3]">{town!.province} · field intelligence</p>
              <p className="mt-1 text-[11px] text-[#5A4E6D]">{pack.archetype}</p>
            </Link>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-[#8B7FA3]">
          {packTowns.length} towns carry field intelligence packs. All {towns.length} canonical database rows are reachable through Towns — geographic designation: 50 BLUEPRINT TOWNS (cohort ratification pending).
        </p>
      </Section>

      <Section title="Your initiatives">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {CANONICAL_TEN.map((i) => (
            <Link key={i.key} href={`/operate/initiative/${i.key}`}
              className="rounded-2xl border border-[#EADFD2] bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <p className="text-xs font-bold text-[#241A33]">{i.name}</p>
              <p className="mt-1 text-[10px] text-[#8B7FA3]">{i.reconciliation.includes('LINKED') ? 'catalogue linked' : i.reconciliation.includes('UNRESOLVED') ? 'match unresolved' : 'database record absent'}</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* MOVEMENT */}
      <Section title="What changed?">
        <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-relaxed text-[#241A33]">
              Last 30 days: {deltas.created.length} canonical town record(s) created, {deltas.updated.length} updated (window: rolling 30 days · source: uto.towns timestamps).
            </p>
            <Stamp kind="computed" />
          </div>
          <p className="mt-2 text-xs text-[#5A4E6D]">
            Change history for operational objects: <span className="font-semibold">CHANGE HISTORY NOT AVAILABLE</span> — no prior-state store exists and operational records are protected. No delta is manufactured.
          </p>
        </div>
      </Section>

      {/* CHIEF OF STAFF */}
      <div className="mt-10">
        <CoS context="Home · your world"
          observe={statements.filter((s) => s.kind === 'computed')}
          explain={statements}
          challenge={[statements[3]]}
          coach={[]}
          proposal={{
            title: 'Portfolio reconciliation',
            detail: 'PROPOSAL — RENAME/DECIDE PENDING HUMAN APPROVAL: resolve the two UNRESOLVED initiative matches (Daycare/DaycareOS, Ubuntu Socials/Buntu Bar) and decide the portfolio status of the four database-only rows.',
            evidence: ['public.initiatives (12 rows)', 'canonical registry (10)'],
          }} />
      </div>

      <div className="mt-8">
        <NextMoves moves={[
          { label: 'See the network — National geography OS', href: '/operate/national' },
          { label: 'Open Senekal × FixEasy — the operating cell', href: '/operate/town/senekal/fixeasy' },
          { label: 'Review the ten engines — Portfolio OS', href: '/operate/initiatives' },
        ]} />
      </div>
    </div>
  );
}
