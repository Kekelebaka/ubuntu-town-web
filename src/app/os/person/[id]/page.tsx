// src/app/os/person/[id]/page.tsx — PERSON / ROLE: a Proof Profile, not a contact card.
// Contribution · Reliability · Capability · Collaboration · Initiative · Scope · Role ·
// Evidence · Next capability · Opportunity · Chief of Staff. Ubuntu Passport visible.
// ⚠ SYNTHETIC DEMO DATA — synthetic personas, no real people.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PEOPLE, WORK, PROOFS, personById, townBySlug } from '@/lib/experience/universe';
import { personStatements, FLYWHEEL } from '@/lib/experience/stories';
import { fiveModes, actRows, actionProposal } from '@/lib/experience/derive';
import { PageHeader, Card, Metric, StatementCard, Crumbs, EvidenceChips } from '@/components/experience/ui';
import ChiefOfStaff from '@/components/experience/ChiefOfStaff';

export const dynamic = 'force-static';

export function generateStaticParams() { return PEOPLE.map((p) => ({ id: p.id })); }

export default async function PersonProofProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const person = personById(id);
  if (!person) notFound();

  const town = townBySlug(person.town);
  const work = WORK.filter((w) => w.owner === id);
  const proofs = PROOFS.filter((p) => work.some((w) => w.id === p.work_id));
  const statements = personStatements(id);
  const modes = fiveModes(statements);
  const proposal = actionProposal(`person:${id}`, person.recommendation);
  const verified = proofs.filter((p) => p.state === 'verified').length;

  return (
    <div>
      <Crumbs trail={[
        { label: 'Ubuntu Town OS', href: '/os' }, { label: town?.name ?? person.town, href: `/os/town/${person.town}` }, { label: person.name },
      ]} />
      <PageHeader eyebrow={`Proof Profile · ${person.roles.join(' · ')}`} title={person.name}
        subtitle={`${person.roleNow} · ${town?.name ?? ''} — evidence moves you; time served does not.`} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><Metric label="reliability (follow-through)" value={`${Math.round(person.reliability * 100)}%`} tone={person.reliability >= 0.8 ? 'green' : person.reliability >= 0.6 ? 'orange' : 'red'} /></Card>
        <Card><Metric label="works owned" value={work.length} tone="purple" /></Card>
        <Card><Metric label="verified proofs" value={verified} tone="green" /></Card>
        <Card><Metric label="capabilities shown" value={person.capability.length} tone="ink" /></Card>
      </div>

      <section className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Contribution — what useful work happened?</p>
          <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{person.contribution}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Reliability — do they follow through?</p>
          <div className="mt-2 h-2 w-full rounded-full bg-[#F0E8DC]">
            <div className={`h-2 rounded-full ${person.reliability >= 0.8 ? 'bg-[#2F7D5C]' : person.reliability >= 0.6 ? 'bg-[#E8730C]' : 'bg-[#C2453B]'}`} style={{ width: `${Math.round(person.reliability * 100)}%` }} />
          </div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Capability — demonstrable</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {person.capability.map((c) => <span key={c} className="rounded-full border border-[#D9C7EA] bg-[#F7F1FB] px-2.5 py-1 text-[11px] font-semibold text-[#5B2A86]">{c}</span>)}
          </div>
        </Card>
        <Card>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Collaboration — can others build with them?</p>
          <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{person.collaboration}</p>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Initiative — do they see and solve?</p>
          <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{person.initiative}</p>
        </Card>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B2600E]">Current scope</p>
          <p className="mt-2 text-sm text-[#241A33]">{person.scope}</p>
          <p className="mt-3 text-[11px] text-[#8B7FA3]">Scope before person — a role is an assignment, not an identity.</p></Card>
        <Card><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B2600E]">Current role</p>
          <p className="mt-2 text-sm text-[#241A33]">{person.roleNow}</p>
          <p className="mt-3 text-[11px] text-[#8B7FA3]">Blueprint role vocabulary — coordinator is one role, not the OS.</p></Card>
        <Card><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#B2600E]">Evidence</p>
          <div className="mt-2"><EvidenceChips ids={person.evidence} /></div></Card>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B2A86]">Next capability</p>
          <p className="mt-2 text-sm text-[#241A33]">{person.nextCapability}</p></Card>
        <Card><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B2A86]">Opportunity</p>
          <p className="mt-2 text-sm text-[#241A33]">{person.opportunity}</p></Card>
      </section>

      {/* UBUNTU PASSPORT — the flywheel carried by the person */}
      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Ubuntu Passport — the flywheel travels with you</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {FLYWHEEL.map((f) => (
            <Link key={f.stage} href={f.href} className="rounded-2xl border border-[#EADFD2] bg-white p-3 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#B2600E]">{f.stage}</p>
              <p className="mt-1 text-[11px] leading-snug text-[#5A4E6D]">{f.copy}</p>
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

      <Card className="mt-6 border-[#D9C7EA] bg-[#F7F1FB]">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B2A86]">Chief of Staff recommendation</p>
        <p className="mt-2 text-sm leading-relaxed text-[#241A33]">{person.recommendation}</p>
        <p className="mt-3 rounded-full border border-[#E7C9A0] bg-[#FDF3E3] px-3 py-1.5 text-[11px] font-bold text-[#8A5410]">
          {proposal.status === 'denied' ? 'DENIED (fail-closed)' : 'PROPOSED — PENDING HUMAN APPROVAL'}
        </p>
      </Card>

      <ChiefOfStaff context={`${person.name} · five modes`} lines={modes} actRows={actRows(statements)} />
    </div>
  );
}
