// src/app/os/national/page.tsx — NATIONAL PULSE. What is changing across Ubuntu Town?
// ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { NATIONAL_STATEMENTS } from '@/lib/experience/stories';
import { PROVINCES, TOWNS, INITIATIVES, OPENING_TILES } from '@/lib/experience/universe';
import { fiveModes, actRows, nationalRollup } from '@/lib/experience/derive';
import { PageHeader, Card, Metric, StatementCard, Crumbs, EvidenceChips } from '@/components/experience/ui';
import ChiefOfStaff from '@/components/experience/ChiefOfStaff';

export const dynamic = 'force-static';

const CATEGORIES = [
  { key: 'MOMENTUM', where: 'Where activity is accelerating', claim: 'Soweto FrameSouth + Senekal FixEasy + Phuthaditjhaba ECD are accelerating.', evidence: ['syn-work-102', 'syn-work-201', 'syn-work-601'], tone: 'green' as const },
  { key: 'CAPACITY', where: 'Where capability is missing', claim: 'Verified supply trails demand in 4 of 6 initiatives (artisan, ECD, carer, producer).', evidence: ['syn-signal-201', 'syn-signal-601', 'syn-signal-501'], tone: 'orange' as const },
  { key: 'MISSION RISK', where: 'Where work is stalling', claim: 'Trade Bridge Mthatha: 5 works blocked > 30 days. Senekal: 1 compliance block.', evidence: ['syn-work-504', 'syn-work-206'], tone: 'red' as const },
  { key: 'PROOF GAPS', where: 'Where work exists but evidence is missing', claim: 'Care Collective 2/9 proofs verified. Trade Bridge 8 proofs missing.', evidence: ['syn-work-701', 'syn-proof-710'], tone: 'red' as const },
  { key: 'ECONOMIC SIGNALS', where: 'Where demand, transactions, earnings or opportunity are moving', claim: 'R148.5k verified work value (Senekal), R96.2k creator earnings (Soweto), R210k indicative demand (Klerksdorp).', evidence: ['syn-work-201', 'syn-work-101', 'syn-signal-801'], tone: 'purple' as const },
  { key: 'PEOPLE', where: 'Where people are progressing, stalled or emerging', claim: '1 builder ready for progression (Palesa), 1 scope request without evidence (Sipho), 1 proof-discipline case (Bongani).', evidence: ['syn-person-palesa', 'syn-person-sipho', 'syn-person-bongani'], tone: 'purple' as const },
  { key: 'OPPORTUNITY', where: 'Where the system detects something worth pursuing', claim: 'Cross-town pilot: Klerksdorp demand × Senekal verified supply.', evidence: ['syn-opp-901'], tone: 'orange' as const },
  { key: 'NEXT ACTION', where: 'What the operating system recommends doing', claim: 'Fund two verification rounds; proof-recovery mission before stipends; intervention review in Mthatha.', evidence: ['syn-work-204', 'syn-work-702', 'syn-work-502'], tone: 'green' as const },
];

export default function NationalPulsePage() {
  const rollup = nationalRollup();
  const modes = fiveModes(NATIONAL_STATEMENTS);
  return (
    <div>
      <Crumbs trail={[{ label: 'Ubuntu Town OS', href: '/os' }, { label: 'National' }]} />
      <PageHeader eyebrow="National Pulse" title="What is changing across Ubuntu Town?"
        subtitle="One intelligence system resolving at national level. National is a distinct job: it sees patterns, capacity and risk — not tasks." />

      <Card>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 lg:grid-cols-6">
          <Metric label="works tracked" value={rollup.metrics.workOpen + rollup.metrics.workPublished} tone="purple" />
          <Metric label="open work" value={rollup.metrics.workOpen} tone="orange" />
          <Metric label="published" value={rollup.metrics.workPublished} tone="green" />
          <Metric label="proofs captured" value={rollup.metrics.proofsCaptured} tone="green" />
          <Metric label="stalled work" value={rollup.metrics.staleOpenWork} tone="red" />
          <Metric label="active people" value={rollup.metrics.peopleActive} tone="ink" />
        </div>
        <p className="mt-4 text-xs text-[#8B7FA3]">
          Proof capture rate {rollup.metrics.proofCaptureRate === null
            ? <span className="font-semibold text-[#A63B33]">INSUFFICIENT EVIDENCE</span>
            : `${Math.round(rollup.metrics.proofCaptureRate * 100)}%`} · computed by the ONE derived engine over the same rows as every other view.
        </p>
      </Card>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Operating categories</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {CATEGORIES.map((c) => (
            <Card key={c.key}>
              <div className="flex items-baseline justify-between">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B2600E]">{c.key}</p>
                <p className="text-[10px] italic text-[#8B7FA3]">{c.where}</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{c.claim}</p>
              <div className="mt-3"><EvidenceChips ids={c.evidence} /></div>
            </Card>
          ))}
        </div>
      </section>

      <section id="provinces" className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Province resolution — 9 provinces</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PROVINCES.map((p) => {
            const towns = TOWNS.filter((t) => t.province === p.slug);
            return (
              <Link key={p.slug} href={`/os/province/${p.slug}`}
                className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
                <p className="text-sm font-bold text-[#241A33]">{p.name}</p>
                <p className="mt-1 text-xs text-[#5A4E6D]">{towns.length} Blueprint towns</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Initiative network</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {INITIATIVES.map((i) => (
            <Link key={i.id} href={`/os/initiative/${i.id}`}
              className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <p className="text-sm font-bold text-[#5B2A86]">{i.name}</p>
              <p className="mt-1 text-xs text-[#5A4E6D]">{i.headline}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">National statements — evidence-linked</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {NATIONAL_STATEMENTS.map((s, i) => <StatementCard key={i} s={s} />)}
        </div>
      </section>

      <ChiefOfStaff context="National scope · five modes over the same evidence"
        lines={modes} actRows={actRows(NATIONAL_STATEMENTS)} />
    </div>
  );
}
