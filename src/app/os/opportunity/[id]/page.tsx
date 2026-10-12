// src/app/os/opportunity/[id]/page.tsx — OPPORTUNITY / OUTCOME detail (server page).
// ⚠ SYNTHETIC DEMO DATA. Mission creation is a PROPOSAL — it never executes here.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OPPORTUNITIES, opportunityById, townBySlug } from '@/lib/experience/universe';
import { EvidenceChips } from '@/components/experience/ui';
import ProposalButton from '@/components/experience/ProposalButton';

export const dynamic = 'force-static';
export function generateStaticParams() { return OPPORTUNITIES.map((o) => ({ id: o.id })); }

export default async function OpportunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const opp = opportunityById(id);
  if (!opp) notFound();
  const town = townBySlug(opp.town);

  return (
    <div>
      <nav className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-[#8B7FA3]">
        <Link href="/os" className="font-medium text-[#5B2A86] hover:underline">Ubuntu Town OS</Link>
        <span>→</span>
        <Link href={`/os/town/${opp.town}`} className="font-medium text-[#5B2A86] hover:underline">{town?.name ?? opp.town}</Link>
        <span>→</span>
        <span className="font-semibold text-[#5A4E6D]">Opportunity</span>
      </nav>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#B2600E]">Opportunity · {opp.status}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight text-[#241A33] sm:text-4xl">{opp.title}</h1>
        <p className="mt-2 max-w-2xl text-base text-[#5A4E6D]">{opp.summary}</p>
      </header>

      <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8B7FA3]">Supporting evidence</p>
        <div className="mt-2"><EvidenceChips ids={opp.evidenceHint} /></div>
        <p className="mt-4 text-xs text-[#8B7FA3]">surfaced {opp.created_at} · evidence-first: this opportunity is a proposal, not a promise.</p>
      </div>

      <div className="mt-6 rounded-2xl border border-[#D9C7EA] bg-[#F7F1FB] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5B2A86]">Next — human in the loop</p>
        <ProposalButton label={`Create mission: ${opp.title}`} />
      </div>
    </div>
  );
}
