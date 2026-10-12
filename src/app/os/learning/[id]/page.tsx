// src/app/os/learning/[id]/page.tsx — LEARNING detail: proof becomes transferable capability.
// ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LEARNINGS, learningById, proofById, townBySlug } from '@/lib/experience/universe';
import { PageHeader, Card, Crumbs, EvidenceChips } from '@/components/experience/ui';

export const dynamic = 'force-static';
export function generateStaticParams() { return LEARNINGS.map((l) => ({ id: l.id })); }

export default async function LearningPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const learning = learningById(id);
  if (!learning) notFound();

  const proof = learning.source_proof_id ? proofById(learning.source_proof_id) : null;
  const town = townBySlug(learning.town);

  return (
    <div>
      <Crumbs trail={[
        { label: 'Ubuntu Town OS', href: '/os' }, { label: town?.name ?? learning.town, href: `/os/town/${learning.town}` }, { label: 'Learning' },
      ]} />
      <PageHeader eyebrow="Learning" title="Proof becomes capability"
        subtitle="Learning is what travels: a lesson extracted from verified work that makes the next person faster." />

      <Card>
        <p className="text-lg leading-relaxed text-[#241A33]">“{learning.text}”</p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[#5A4E6D]">
          <span>captured {learning.created_at}</span>
          {proof && <Link href={`/os/proof/${proof.id}`} className="rounded-full border border-[#E7C9A0] bg-[#FDF3E3] px-2.5 py-1 font-semibold text-[#8A5410] hover:bg-[#F8E7CC]">from proof: {proof.note}</Link>}
        </div>
      </Card>

      <div className="mt-8"><EvidenceChips ids={[id, ...(learning.source_proof_id ? [learning.source_proof_id] : [])]} /></div>
    </div>
  );
}
