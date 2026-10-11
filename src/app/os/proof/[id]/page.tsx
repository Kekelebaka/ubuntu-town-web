// src/app/os/proof/[id]/page.tsx — PROOF detail. Trust model: evidence or INSUFFICIENT EVIDENCE.
// ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PROOFS, LEARNINGS, proofById, workById, townBySlug } from '@/lib/experience/universe';
import { PageHeader, Card, Crumbs, EvidenceChips, StatementCard } from '@/components/experience/ui';
import type { PulseStatement } from '@/lib/pulse/types';

export const dynamic = 'force-static';
export function generateStaticParams() { return PROOFS.map((p) => ({ id: p.id })); }

export default async function ProofPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const proof = proofById(id);
  if (!proof) notFound();

  const work = workById(proof.work_id);
  const town = townBySlug(proof.town);
  const learnings = LEARNINGS.filter((l) => l.source_proof_id === id);

  const statement: PulseStatement = proof.state === 'verified'
    ? { kind: 'signal', interpretation: `Proof verified: ${proof.note}`, evidence: [id], capabilityImplication: 'This evidence counts toward capability progression.', nextAction: null, owner: null, reviewPoint: null }
    : { kind: 'insufficient_evidence', interpretation: 'INSUFFICIENT EVIDENCE', evidence: [id], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null,
        reason: `Proof is captured but NOT verified (${proof.state}). Missing: independent review sign-off. How to collect: a town lead reviews and verifies this proof.` };

  return (
    <div>
      <Crumbs trail={[
        { label: 'Ubuntu Town OS', href: '/os' }, { label: town?.name ?? proof.town, href: `/os/town/${proof.town}` },
        ...(work ? [{ label: work.title, href: `/os/mission/${work.id}` }] : []), { label: 'Proof' },
      ]} />
      <PageHeader eyebrow={`Proof · ${proof.state}`} title={proof.note}
        subtitle="Proof is what turns work into capability. Without it the system says so." />

      <Card>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">State</p>
            <p className={`mt-1 text-sm font-bold ${proof.state === 'verified' ? 'text-[#2F7D5C]' : 'text-[#B2600E]'}`}>{proof.state}</p></div>
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">Captured</p><p className="mt-1 text-sm text-[#241A33]">{proof.created_at}</p></div>
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">Mission</p>
            {work ? <Link href={`/os/mission/${work.id}`} className="mt-1 block text-sm font-bold text-[#5B2A86] hover:underline">{work.title}</Link> : <p className="mt-1 text-sm text-[#5A4E6D]">—</p>}</div>
          <div><p className="text-xs uppercase tracking-[0.12em] text-[#8B7FA3]">Row id</p><p className="mt-1 font-mono text-xs text-[#5A4E6D]">{proof.id}</p></div>
        </div>
      </Card>

      <div className="mt-8"><StatementCard s={statement} /></div>

      {learnings.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Learning unlocked</h2>
          <div className="mt-3 space-y-2">
            {learnings.map((l) => (
              <Link key={l.id} href={`/os/learning/${l.id}`} className="block rounded-xl border border-[#EADFD2] bg-white px-4 py-3 text-sm shadow-sm hover:bg-[#FDF9F3]">
                {l.text}
              </Link>
            ))}
          </div>
        </section>
      )}
      <div className="mt-6"><EvidenceChips ids={[id, proof.work_id]} /></div>
    </div>
  );
}
