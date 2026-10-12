// src/app/os/town/[slug]/page.tsx — TOWN PULSE (Senekal is the deep example).
// People · Work · Proof · Economics · Attention · Recommended next move. Everything clickable.
// ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TOWNS, WORK, PROOFS, SIGNALS, LEARNINGS, OPPORTUNITIES, INITIATIVES, townBySlug } from '@/lib/experience/universe';
import { townStatements } from '@/lib/experience/stories';
import { fiveModes, actRows, peopleOf, viewOf } from '@/lib/experience/derive';
import { PageHeader, Card, Metric, StatementCard, Crumbs, EvidenceChips } from '@/components/experience/ui';
import ChiefOfStaff from '@/components/experience/ChiefOfStaff';

export const dynamic = 'force-static';

export function generateStaticParams() { return TOWNS.map((t) => ({ slug: t.slug })); }

export default async function TownPulsePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const town = townBySlug(slug);
  if (!town) notFound();

  const work = WORK.filter((w) => w.town === slug);
  const proofs = PROOFS.filter((p) => p.town === slug);
  const signals = SIGNALS.filter((s) => s.town === slug);
  const learnings = LEARNINGS.filter((l) => l.town === slug);
  const opps = OPPORTUNITIES.filter((o) => o.town === slug);
  const initiatives = INITIATIVES.filter((i) => i.town === slug);
  const people = peopleOf(slug);
  const statements = townStatements(slug);
  const modes = fiveModes(statements);
  const rollup = viewOf(`town:${slug}`);

  const verifiedProofs = proofs.filter((p) => p.state === 'verified').length;
  const missingProofs = work.filter((w) => w.status === 'published' && !proofs.some((p) => p.work_id === w.id)).length;

  return (
    <div>
      <Crumbs trail={[{ label: 'Ubuntu Town OS', href: '/os' }, { label: 'National', href: '/os/national' }, { label: town.name }]} />
      <PageHeader eyebrow={`Town Pulse · ${town.name}`} title={`${town.name.toUpperCase()}`}
        subtitle="People, work, proof, economics, attention — and the recommended next move. Every row clickable." />

      <Card>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="active builders" value={people.length} tone="purple" />
          <Metric label="missions" value={work.length} tone="ink" />
          <Metric label="completed" value={work.filter((w) => w.status === 'published').length} tone="green" />
          <Metric label="blocked / stalled" value={work.filter((w) => w.status === 'draft').length} tone="red" />
          <Metric label="verified proof" value={verifiedProofs} tone="green" />
          <Metric label="missing proof" value={missingProofs} tone={missingProofs > 0 ? 'red' : 'ink'} />
        </div>
        {rollup.status === 'ok' && rollup.node && (
          <p className="mt-4 text-xs text-[#8B7FA3]">Engine rollup: {rollup.node.metrics.workOpen} open · {rollup.node.metrics.workPublished} published · {rollup.node.metrics.proofsCaptured} proofs · {rollup.node.metrics.staleOpenWork} stalled</p>
        )}
      </Card>

      <section id="people" className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">People — proof profiles</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {people.map((p) => (
            <Link key={p.id} href={`/os/person/${p.id}`}
              className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <p className="text-sm font-bold text-[#241A33]">{p.name}</p>
              <p className="mt-0.5 text-xs text-[#B2600E]">{p.roles.join(' · ')}</p>
              <p className="mt-1 text-xs text-[#5A4E6D]">{p.contribution}</p>
            </Link>
          ))}
          {people.length === 0 && <p className="text-sm text-[#A63B33]">INSUFFICIENT EVIDENCE — no people rows for this town yet.</p>}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Work — missions</h2>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {work.map((w) => (
            <Link key={w.id} href={`/os/mission/${w.id}`}
              className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-[#241A33]">{w.title}</p>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${w.status === 'published' ? 'bg-[#E5F2EC] text-[#2F7D5C]' : w.status === 'draft' ? 'bg-[#FDF1F0] text-[#A63B33]' : 'bg-[#FDF3E3] text-[#8A5410]'}`}>{w.status}</span>
              </div>
              <p className="mt-1 text-[11px] text-[#8B7FA3]">updated {w.updated_at}</p>
            </Link>
          ))}
          {work.length === 0 && <p className="text-sm text-[#A63B33]">INSUFFICIENT EVIDENCE — no work rows for this town yet.</p>}
        </div>
      </section>

      <section className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Proof</h2>
          <div className="mt-3 space-y-2">
            {proofs.map((p) => (
              <Link key={p.id} href={`/os/proof/${p.id}`} className="flex items-center justify-between rounded-xl border border-[#F0E8DC] px-3 py-2 text-xs hover:bg-[#FDF9F3]">
                <span className="text-[#241A33]">{p.note}</span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.state === 'verified' ? 'bg-[#E5F2EC] text-[#2F7D5C]' : 'bg-[#FDF3E3] text-[#8A5410]'}`}>{p.state}</span>
              </Link>
            ))}
            {proofs.length === 0 && <p className="text-sm text-[#A63B33]">INSUFFICIENT EVIDENCE — no proof captured yet.</p>}
          </div>
        </Card>
        <Card>
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Economics & opportunity</h2>
          <div className="mt-3 space-y-3">
            {initiatives.map((i) => (
              <p key={i.id} className="text-sm text-[#5A4E6D]"><span className="font-semibold text-[#5B2A86]">{i.name}:</span> {i.economics.label} — <span className="font-bold text-[#B2600E]">{i.economics.value}</span></p>
            ))}
            {opps.map((o) => (
              <Link key={o.id} href={`/os/opportunity/${o.id}`} className="block rounded-xl border border-[#F0E8DC] px-3 py-2 text-xs hover:bg-[#FDF9F3]">
                <span className="font-semibold text-[#5B2A86]">{o.title}</span> — {o.summary}
              </Link>
            ))}
          </div>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Attention & recommended next move</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statements.map((s, i) => <StatementCard key={i} s={s} />)}
        </div>
        <div className="mt-4"><EvidenceChips ids={[...signals.map((s) => s.id), ...learnings.map((l) => l.id)]} /></div>
      </section>

      <ChiefOfStaff context={`${town.name} scope · five modes`} lines={modes} actRows={actRows(statements)} />
    </div>
  );
}
