// src/app/os/mission/[id]/page.tsx — MISSION / WORK detail: work → proof → learning chain.
// ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { WORK, PROOFS, LEARNINGS, OPPORTUNITIES, workById, personById, initiativeById, townBySlug } from '@/lib/experience/universe';
import { PageHeader, Card, Crumbs, EvidenceChips, StatementCard } from '@/components/experience/ui';
import type { PulseStatement } from '@/lib/pulse/types';

export const dynamic = 'force-static';
export function generateStaticParams() { return WORK.map((w) => ({ id: w.id })); }

export default async function MissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const work = workById(id);
  if (!work) notFound();

  const town = townBySlug(work.town);
  const person = personById(work.owner);
  const init = initiativeById(work.initiative);
  const proofs = PROOFS.filter((p) => p.work_id === id);
  const learnings = LEARNINGS.filter((l) => proofs.some((p) => p.id === l.source_proof_id));
  const opps = OPPORTUNITIES.filter((o) => o.evidenceHint.includes(id));
  const missing = proofs.length === 0;

  const statement: PulseStatement = missing
    ? { kind: 'insufficient_evidence', interpretation: 'INSUFFICIENT EVIDENCE', evidence: [id], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
        reason: `This mission has no proof rows. Missing: signed outcome evidence. How to collect: capture a photo/sign-off at completion and attach it to this mission (a proof-recovery mission can close the gap).` }
    : { kind: 'signal', interpretation: `Work carried to ${work.status} with ${proofs.length} proof row(s).`, evidence: [id, ...proofs.map((p) => p.id)],
        capabilityImplication: 'Evidence chain is intact — this work can count toward capability.', nextAction: null, owner: person?.name ?? null, reviewPoint: null };

  return (
    <div>
      <Crumbs trail={[
        { label: 'Ubuntu Town OS', href: '/os' }, { label: town?.name ?? work.town, href: `/os/town/${work.town}` },
        ...(init ? [{ label: init.name, href: `/os/initiative/${init.id}` }] : []), { label: 'Mission' },
      ]} />
      <PageHeader eyebrow="Mission / Work" title={work.title}
        subtitle="Work becomes proof. Proof becomes learning. Learning becomes capability. Capability creates opportunity." />

      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">Status</p>
            <p className="mt-1 text-sm font-bold text-[#241A33]">{work.status}</p></div>
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">Owner</p>
            {person ? <Link href={`/os/person/${person.id}`} className="mt-1 block text-sm font-bold text-[#5B2A86] hover:underline">{person.name}</Link> : <p className="mt-1 text-sm text-[#5A4E6D]">{work.owner}</p>}</div>
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">Started</p><p className="mt-1 text-sm text-[#241A33]">{work.created_at}</p></div>
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">Last movement</p><p className="mt-1 text-sm text-[#241A33]">{work.updated_at}</p></div>
        </div>
      </Card>

      <section className="mt-8">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Proof chain</h2>
        <div className="mt-3 space-y-2">
          {proofs.map((p) => (
            <Link key={p.id} href={`/os/proof/${p.id}`} className="flex items-center justify-between rounded-xl border border-[#EADFD2] bg-white px-4 py-3 text-sm shadow-sm hover:bg-[#FDF9F3]">
              <span className="text-[#241A33]">{p.note}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${p.state === 'verified' ? 'bg-[#E5F2EC] text-[#2F7D5C]' : 'bg-[#FDF3E3] text-[#8A5410]'}`}>{p.state}</span>
            </Link>
          ))}
        </div>
        <div className="mt-3"><EvidenceChips ids={[id, ...proofs.map((p) => p.id), ...learnings.map((l) => l.id)]} /></div>
      </section>

      {learnings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Learnings from this work</h2>
          <div className="mt-3 space-y-2">
            {learnings.map((l) => (
              <Link key={l.id} href={`/os/learning/${l.id}`} className="block rounded-xl border border-[#EADFD2] bg-white px-4 py-3 text-sm shadow-sm hover:bg-[#FDF9F3]">
                <span className="text-[#241A33]">{l.text}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {opps.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Opportunity this work opens</h2>
          <div className="mt-3 space-y-2">
            {opps.map((o) => (
              <Link key={o.id} href={`/os/opportunity/${o.id}`} className="block rounded-xl border border-[#EADFD2] bg-white px-4 py-3 text-sm shadow-sm hover:bg-[#FDF9F3]">
                <span className="font-semibold text-[#5B2A86]">{o.title}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-8"><StatementCard s={statement} /></div>
    </div>
  );
}
