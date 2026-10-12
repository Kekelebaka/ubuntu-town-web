// src/app/operate/admin/town/[slug]/page.tsx — TOWN RECORD EDIT (top administration).
// Field-level provenance (which table owns which field), governance locks, and a
// preview→confirm→write flow where the database (RLS) has the final word.

import Link from 'next/link';
import { getCanonicalTowns, provinceSlug } from '@/lib/e003/os';
import { packForTown } from '@/lib/e003/field-intelligence/packs';
import { Section, Stamp, ContextBar } from '@/components/e003/os-ui';
import { TOWN_EDIT_FIELDS } from '@/lib/admin-rbac';
import TownEditClient from '@/components/e003/admin/TownEditClient';

export const dynamic = 'force-dynamic';

export default async function AdminTownEdit({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const towns = await getCanonicalTowns();
  const town = towns.find((t) => t.slug === slug);

  if (!town) {
    return (
      <div>
        <ContextBar trail={[{ label: 'Admin', href: '/operate/admin' }, { label: 'Town records', href: '/operate/admin/towns' }, { label: 'Unknown' }]} />
        <h1 className="text-2xl font-bold text-[#241A33]">No canonical town with this slug</h1>
        <p className="mt-2 text-sm text-[#5A4E6D]">The town record must exist before it can be maintained. Nothing is invented to fill an editor.</p>
        <Link href="/operate/admin/towns" className="mt-4 inline-block rounded-full bg-[#5B2A86] px-5 py-2.5 text-sm font-semibold text-white">Back to town records</Link>
      </div>
    );
  }

  const pack = packForTown(town.name);

  return (
    <div>
      <ContextBar trail={[
        { label: 'Admin', href: '/operate/admin' },
        { label: 'Town records', href: '/operate/admin/towns' },
        { label: town.name },
      ]} />

      <section className="rounded-3xl bg-gradient-to-br from-[#241A33] via-[#3B2A52] to-[#5B2A86] px-8 py-9 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#F5C97E]">Town record · canonical</p>
        <h1 className="mt-2 text-3xl font-black">{town.name.toUpperCase()}</h1>
        <p className="mt-2 text-sm text-[#E9DDF5]">{town.province} · uto.towns row {town.id.slice(0, 8)}… ·
          {' '}{town.is_founding ? 'founding-flagged (roster ratification pending — G4)' : 'not founding-flagged'}
        </p>
      </section>

      <Section title="Maintain this record" right={<Stamp kind="real" />}>
        <TownEditClient
          slug={town.slug}
          name={town.name}
          initial={{
            status: town.status ?? '',
            recruitment_status: town.recruitment_status ?? '',
            applicant_count: town.applicant_count != null ? String(town.applicant_count) : '',
            opportunity_notes: town.opportunity_notes ?? '',
            is_founding: town.is_founding ? 'true' : 'false',
            public_self_approve: (town as any).public_self_approve ? 'true' : 'false',
          }}
          fields={TOWN_EDIT_FIELDS.map((f) => ({ name: f.name, label: f.label, type: f.type, options: f.options ?? [], locked: Boolean(f.locked), note: f.note ?? '', table: f.table }))}
        />
      </Section>

      {/* PROVENANCE + CONTEXT */}
      <Section title="Provenance &amp; context">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Which table owns what</p>
            <ul className="mt-2 space-y-1 text-[11px] text-[#5A4E6D]">
              <li>▸ <span className="font-semibold text-[#241A33]">uto.towns</span> (canonical, 81 rows): status · recruitment_status · applicant_count · opportunity_notes · is_founding (locked) · public_self_approve (locked)</li>
              <li>▸ <span className="font-semibold text-[#241A33]">public.towns</span> (legacy narrative, 7 rows): archetype · population_estimate — a separate source, slug-joined, never merged</li>
              <li>▸ <span className="font-semibold text-[#241A33]">Field intelligence</span> (research packs): read-only here — research artefacts are not town records</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#EADFD2] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8B7FA3]">Context on file</p>
            <p className="mt-2 text-[11px] text-[#5A4E6D]">
              {pack ? `Field intelligence pack: ${pack.pack_id || '(pack id missing — source data quality)'} · archetype: ${pack.archetype} · ${pack.opportunity_domains.length} opportunity domain(s). Research, review_required — visible on the town page.` : 'No field-intelligence pack exists for this town.'}
            </p>
            <p className="mt-2 text-[11px] text-[#5A4E6D]">
              Current record state: {town.status ?? 'unset'} · recruitment {town.recruitment_status ?? 'unset'} ·
              applicants {town.applicant_count ?? 0} · opportunity notes {town.opportunity_notes ? 'present' : 'none recorded'}.
            </p>
            <Link href={`/operate/town/${town.slug}`} className="mt-2 inline-block text-xs font-semibold text-[#5B2A86] hover:underline">view the public town page →</Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
