// src/app/operate/admin/towns/page.tsx — TOWN RECORDS (top administration).
// The canonical 81-row geography with the fields this surface may maintain. Governance-locked
// fields are visibly locked (G4 roster authority), legacy narrative stays a separate source.

import Link from 'next/link';
import { getCanonicalTowns, provinceGroups } from '@/lib/e003/os';
import { Section, Stamp } from '@/components/e003/os-ui';

export const dynamic = 'force-dynamic';

export default async function AdminTowns() {
  const towns = await getCanonicalTowns();
  const provinces = provinceGroups(towns);

  return (
    <div>
      <Section title="Town records" right={<Stamp kind="real" />}>
        <div className="rounded-2xl border border-[#E7C9A0] bg-[#FDF9F1] p-5">
          <p className="text-xs leading-relaxed text-[#5A4E6D]">
            <span className="font-semibold text-[#8A5410]">Editable:</span> record status · recruitment
            status · applicant count · opportunity notes (canonical uto.towns).
            <span className="font-semibold text-[#8A5410]"> Governance-locked:</span> founding flag ·
            public self-approve (roster and permission decisions — G4).
            <span className="font-semibold text-[#8A5410]"> Separate source:</span> legacy narrative
            fields (archetype, population) live in public.towns (7 rows) — edited separately, never
            merged into the canonical record.
          </p>
        </div>
      </Section>

      {provinces.map((p) => (
        <Section key={p.province} title={`${p.province} — ${p.towns.length} canonical rows`}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {p.towns.map((t) => (
              <Link key={t.id} href={`/operate/admin/town/${t.slug}`}
                className="rounded-2xl border border-[#EADFD2] bg-white px-4 py-3 shadow-sm hover:-translate-y-0.5 hover:border-[#D9B27C]">
                <p className="text-sm font-semibold text-[#241A33]">{t.name}</p>
                <p className="mt-0.5 text-[10px] text-[#8B7FA3]">
                  {t.status ?? 'unset'} · {t.recruitment_status ?? 'unset'} · {t.applicant_count ?? 0} applicants
                  {t.is_founding ? ' · founding-flagged (locked)' : ''}
                </p>
              </Link>
            ))}
          </div>
        </Section>
      ))}
    </div>
  );
}
