// src/app/os/page.tsx — THE OPENING (operating-intelligence home, not a KPI dashboard).
// ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { OPENING_TILES, TOWNS, PROVINCES, INITIATIVES } from '@/lib/experience/universe';
import { NATIONAL_STATEMENTS, FLYWHEEL } from '@/lib/experience/stories';
import { fiveModes, actRows, nationalRollup } from '@/lib/experience/derive';
import { SignalTile, StatementCard, EvidenceChips, PageHeader, Card } from '@/components/experience/ui';
import ChiefOfStaff from '@/components/experience/ChiefOfStaff';

export const dynamic = 'force-static';

export default function OpeningPage() {
  const rollup = nationalRollup();
  const modes = fiveModes(NATIONAL_STATEMENTS);

  return (
    <div>
      {/* HERO — the operating-intelligence opening */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B1A5E] via-[#5B2A86] to-[#8A4FA8] px-8 py-12 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-[#E8730C]/30 blur-2xl" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#F5C97E]">Ubuntu Town OS</p>
        <h1 className="mt-3 text-4xl font-black leading-none sm:text-6xl">THE TOWN<br />IS MOVING.</h1>
        <p className="mt-4 text-sm text-[#E9DDF5] sm:text-base">
          National Pulse · 50 Blueprint Towns · 9 Provinces · Initiative Network
        </p>
        <div className="mt-6 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full border border-white/30 px-3 py-1">{TOWNS.length} towns in view</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{PROVINCES.length} provinces</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{INITIATIVES.length} initiatives moving</span>
          <span className="rounded-full border border-white/30 px-3 py-1">{rollup.metrics.workOpen + rollup.metrics.workPublished} works tracked</span>
        </div>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-[#E9DDF5]">
          I can see my world. I understand what matters. I know what to do.
          <span className="ml-2 text-[#F5C97E]">Every claim below links to its evidence.</span>
        </p>
      </section>

      {/* INTERACTIVE OPERATING SIGNALS */}
      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">What is happening · what matters · what needs attention</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {OPENING_TILES.map((t) => <SignalTile key={t.key} tile={t} />)}
        </div>
      </section>

      {/* THE HIERARCHY, made legible */}
      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">How the system resolves — one intelligence, five resolutions</h2>
        <div className="mt-4 flex flex-wrap items-stretch gap-3">
          {[
            { label: 'NATIONAL', href: '/os/national', copy: 'What is changing across Ubuntu Town?' },
            { label: 'PROVINCE', href: '/os/province/free-state', copy: 'A different resolution of the same truth.' },
            { label: 'TOWN', href: '/os/town/senekal', copy: 'Senekal — people, work, proof, economics.' },
            { label: 'INITIATIVE', href: '/os/initiative/syn-init-fixeasy-senekal', copy: 'FixEasy — demand, supply, gap.' },
            { label: 'PERSON', href: '/os/person/syn-person-palesa', copy: 'Proof Profile — capability with evidence.' },
          ].map((step) => (
            <Link key={step.label} href={step.href}
              className="flex-1 rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <p className="text-xs font-bold tracking-[0.16em] text-[#5B2A86]">{step.label}</p>
              <p className="mt-1 text-xs text-[#5A4E6D]">{step.copy}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* FLYWHEEL — work becomes proof becomes capability becomes opportunity */}
      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">The human flywheel — evidence moves you, time served does not</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {FLYWHEEL.map((f) => (
            <Link key={f.stage} href={f.href}
              className="rounded-2xl border border-[#EADFD2] bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B2600E]">{f.stage}</p>
              <p className="mt-1 text-[11px] leading-snug text-[#5A4E6D]">{f.copy}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* NATIONAL STATEMENTS + CHIEF OF STAFF */}
      <section className="mt-12">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">National intelligence — every claim evidence-linked</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {NATIONAL_STATEMENTS.map((s, i) => <StatementCard key={i} s={s} />)}
        </div>
      </section>

      <ChiefOfStaff context="National scope · what changed, what matters, what I can do"
        lines={modes} actRows={actRows(NATIONAL_STATEMENTS)} />

      <Card className="mt-10">
        <PageHeader eyebrow="Principle" title="Evidence before title. Scope before person." />
        <p className="max-w-3xl text-sm leading-relaxed text-[#5A4E6D]">
          The AI never becomes the hero — the human becomes more capable. Where the evidence is thin, this system
          says <span className="font-semibold text-[#A63B33]">INSUFFICIENT EVIDENCE</span> instead of inventing
          intelligence, and tells you what to collect. Proposals never execute without a human.
        </p>
        <div className="mt-4"><EvidenceChips ids={['syn-proof-301', 'syn-learning-401', 'syn-opp-903']} /></div>
      </Card>
    </div>
  );
}
