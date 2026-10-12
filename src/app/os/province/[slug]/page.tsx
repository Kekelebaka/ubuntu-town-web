// src/app/os/province/[slug]/page.tsx — PROVINCE PULSE: a different resolution of the same
// intelligence system. ⚠ SYNTHETIC DEMO DATA.

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PROVINCES, TOWNS, INITIATIVES, WORK, PEOPLE, SIGNALS } from '@/lib/experience/universe';
import { provinceStatements } from '@/lib/experience/stories';
import { fiveModes, actRows, viewOf } from '@/lib/experience/derive';
import { PageHeader, Card, Metric, StatementCard, Crumbs, EvidenceChips } from '@/components/experience/ui';
import ChiefOfStaff from '@/components/experience/ChiefOfStaff';

export const dynamic = 'force-static';

export function generateStaticParams() { return PROVINCES.map((p) => ({ slug: p.slug })); }

export default async function ProvincePulsePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const province = PROVINCES.find((p) => p.slug === slug);
  if (!province) notFound();

  const towns = TOWNS.filter((t) => t.province === slug);
  const townSlugs = new Set(towns.map((t) => t.slug));
  const work = WORK.filter((w) => townSlugs.has(w.town));
  const people = PEOPLE.filter((p) => townSlugs.has(p.town));
  const signals = SIGNALS.filter((s) => townSlugs.has(s.town));
  const initiatives = INITIATIVES.filter((i) => townSlugs.has(i.town));
  const statements = provinceStatements(slug);
  const modes = fiveModes(statements);
  const rollup = viewOf(`province:${slug}`);

  return (
    <div>
      <Crumbs trail={[{ label: 'Ubuntu Town OS', href: '/os' }, { label: 'National', href: '/os/national' }, { label: province.name }]} />
      <PageHeader eyebrow={`Province Pulse · ${province.name}`}
        title={`${province.name} — a finer resolution of the same truth`}
        subtitle="Provincial momentum, town comparisons, initiative patterns, capacity gaps, opportunities, people patterns, interventions required." />

      <Card>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="Blueprint towns" value={towns.length} tone="purple" />
          <Metric label="initiatives" value={initiatives.length} tone="purple" />
          <Metric label="works" value={work.length} tone="ink" />
          <Metric label="signals" value={signals.length} tone="orange" />
          <Metric label="people in motion" value={people.length} tone="green" />
          <Metric label="stalled (engine)" value={rollup.status === 'ok' && rollup.node ? rollup.node.metrics.staleOpenWork : '—'} tone="red" />
        </div>
      </Card>

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Town comparison</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-[#EADFD2] bg-white shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F1FB] text-[#5B2A86]">
              <tr><th className="px-4 py-2">Town</th><th className="px-4 py-2">Initiatives</th><th className="px-4 py-2">Works</th><th className="px-4 py-2">People</th><th className="px-4 py-2">State</th></tr>
            </thead>
            <tbody>
              {towns.map((t) => {
                const tw = work.filter((w) => w.town === t.slug);
                const ti = initiatives.filter((i) => i.town === t.slug);
                const tp = people.filter((p) => p.town === t.slug);
                const state = tw.length === 0 ? 'no operating rows yet' : (tw.some((w) => w.status === 'published') ? 'moving' : 'forming');
                return (
                  <tr key={t.slug} className="border-t border-[#F0E8DC]">
                    <td className="px-4 py-2"><Link href={`/os/town/${t.slug}`} className="font-semibold text-[#5B2A86] hover:underline">{t.name}</Link></td>
                    <td className="px-4 py-2 text-[#5A4E6D]">{ti.length || '—'}</td>
                    <td className="px-4 py-2 text-[#5A4E6D]">{tw.length || '—'}</td>
                    <td className="px-4 py-2 text-[#5A4E6D]">{tp.length || '—'}</td>
                    <td className="px-4 py-2"><span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${state === 'moving' ? 'bg-[#E5F2EC] text-[#2F7D5C]' : state === 'forming' ? 'bg-[#FDF3E3] text-[#8A5410]' : 'bg-[#F3EEF7] text-[#8B7FA3]'}`}>{state}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {initiatives.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Initiative patterns</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {initiatives.map((i) => (
              <Link key={i.id} href={`/os/initiative/${i.id}`}
                className="rounded-2xl border border-[#EADFD2] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#D9B27C]">
                <p className="text-sm font-bold text-[#5B2A86]">{i.name}</p>
                <p className="mt-1 text-xs text-[#5A4E6D]">{i.intelligence}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-sm font-bold uppercase tracking-[0.22em] text-[#8B7FA3]">Interventions required — evidence-linked</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {statements.map((s, i) => <StatementCard key={i} s={s} />)}
        </div>
      </section>

      <div className="mt-8"><EvidenceChips ids={signals.map((s) => s.id)} /></div>

      <ChiefOfStaff context={`${province.name} scope · five modes`} lines={modes} actRows={actRows(statements)} />
    </div>
  );
}
