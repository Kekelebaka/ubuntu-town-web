// src/app/os/initiative/[id]/page.tsx — INITIATIVE PULSE: a coherent operational story.
// DEMAND · SUPPLY · GAP · WORK · PROOF · INTELLIGENCE · CHIEF OF STAFF · WHY · NEXT.
// ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { INITIATIVES, WORK, PROOFS, SIGNALS, initiativeById, townBySlug, PEOPLE } from '@/lib/experience/universe';
import { initiativeStatements } from '@/lib/experience/stories';
import { fiveModes, actRows, actionProposal } from '@/lib/experience/derive';
import { PageHeader, Card, Metric, StatementCard, Crumbs, EvidenceChips } from '@/components/experience/ui';
import ChiefOfStaff from '@/components/experience/ChiefOfStaff';

export const dynamic = 'force-static';

export function generateStaticParams() { return INITIATIVES.map((i) => ({ id: i.id })); }

export default async function InitiativePulsePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const init = initiativeById(id);
  if (!init) notFound();

  const town = townBySlug(init.town);
  const work = WORK.filter((w) => w.initiative === id);
  const proofs = PROOFS.filter((p) => work.some((w) => w.id === p.work_id));
  const signals = SIGNALS.filter((s) => s.town === init.town);
  const people = PEOPLE.filter((p) => work.some((w) => w.owner === p.id));
  const statements = initiativeStatements(id);
  const modes = fiveModes(statements);
  const gap = init.supply.required - init.supply.verified;
  const proposal = actionProposal(`initiative:${id}`, init.next === 'Create Mission' ? init.chief.replace('Recommendation: ', '') : init.chief.replace('Recommendation: ', ''));

  return (
    <div>
      <Crumbs trail={[
        { label: 'Ubuntu Town OS', href: '/os' }, { label: 'National', href: '/os/national' },
        { label: town?.name ?? init.town, href: `/os/town/${init.town}` }, { label: init.name },
      ]} />
      <PageHeader eyebrow={`Initiative Pulse · ${init.name} — ${town?.name ?? init.town}`} title={`${init.name.toUpperCase()} — ${town?.name.toUpperCase() ?? ''}`}
        subtitle={init.headline} />

      {/* DEMAND · SUPPLY · GAP */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><Metric label={init.demand.label} value={init.demand.count} tone="purple" />
          <p className="mt-2 text-xs text-[#5A4E6D]">DEMAND</p></Card>
        <Card><Metric label={init.supply.label} value={`${init.supply.verified} verified`} tone="green" />
          <p className="mt-2 text-xs text-[#5A4E6D]">SUPPLY — {init.supply.required} required</p></Card>
        <Card><Metric label="gap" value={gap > 0 ? gap : 0} tone={gap > 0 ? 'red' : 'green'} />
          <p className="mt-2 text-xs text-[#5A4E6D]">GAP</p></Card>
      </div>

      {/* WORK · PROOF */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Work</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Metric label="total" value={init.work.total} />
            <Metric label="completed" value={init.work.completed} tone="green" />
            <Metric label="active" value={init.work.active} tone="orange" />
            <Metric label="blocked" value={init.work.blocked} tone="red" />
          </div>
          <div className="mt-3 space-y-1">
            {work.map((w) => (
              <Link key={w.id} href={`/os/mission/${w.id}`} className="block rounded-lg px-2 py-1 text-xs text-[#5B2A86] hover:bg-[#F3EBFA]">→ {w.title}</Link>
            ))}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Proof</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Metric label="verified" value={init.proof.verified} tone="green" />
            <Metric label="pending" value={init.proof.pending} tone="orange" />
            <Metric label="missing" value={init.proof.missing} tone="red" />
          </div>
          <div className="mt-3 space-y-1">
            {proofs.map((p) => (
              <Link key={p.id} href={`/os/proof/${p.id}`} className="block rounded-lg px-2 py-1 text-xs text-[#5B2A86] hover:bg-[#F3EBFA]">→ {p.note}</Link>
            ))}
          </div>
        </Card>
      </div>

      {/* INTELLIGENCE */}
      <Card className="mt-4 border-[#D9C7EA] bg-[#F7F1FB]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B2A86]">Intelligence</p>
        <p className="mt-2 text-lg font-semibold leading-relaxed text-[#241A33]">{init.intelligence}</p>
        <div className="mt-3"><EvidenceChips ids={signals.slice(0, 3).map((s) => s.id)} /></div>
      </Card>

      {/* WHY + NEXT (Chief of Staff's reasoning on the page) */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B2600E]">Why</p>
          <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{init.why}</p>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B2600E]">Next</p>
          <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{init.chief}</p>
          <p className="mt-3 rounded-full border border-[#E7C9A0] bg-[#FDF3E3] px-3 py-1.5 text-[11px] font-bold text-[#8A5410]">
            {proposal.status === 'denied' ? 'DENIED (fail-closed)' : 'PROPOSED — PENDING HUMAN APPROVAL'} · nothing executes without you
          </p>
        </Card>
      </div>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">People carrying this initiative</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {people.map((p) => (
            <Link key={p.id} href={`/os/person/${p.id}`} className="rounded-full border border-[#EADFD2] bg-white px-3 py-1.5 text-xs font-semibold text-[#5B2A86] hover:bg-[#F3EBFA]">
              {p.name} · {p.roles[0]}
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Statements — evidence-linked</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statements.map((s, i) => <StatementCard key={i} s={s} />)}
        </div>
      </section>

      <ChiefOfStaff context={`${init.name} — ${town?.name ?? init.town} · five modes`} lines={modes} actRows={actRows(statements)} />
    </div>
  );
}
