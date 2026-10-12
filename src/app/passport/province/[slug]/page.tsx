// /passport/province/[slug] — province rollup (READ-ONLY).

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/supabase-clients/server';
import { loadIntelligence, loadProvince } from '@/lib/passport/repository';
import { rollupProvince, dataStateLine } from '@/lib/passport/rollups';

export const dynamic = 'force-dynamic';

export default async function PassportProvincePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=/passport/province/${slug}`);

  const res = await loadProvince(slug.replace(/-/g, ' '));
  const full = await loadIntelligence();

  return (
    <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-stone-900">Province Rollup — {res.data?.province ?? slug}</h1>
      <div className="rounded border border-stone-300 bg-stone-50 p-2 text-[11px] text-stone-600">{dataStateLine(res)}</div>

      {res.data && full.data ? (
        <>
          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">Rollup counts (comparable units only)</h2>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded bg-stone-50 p-2">towns: <strong>{res.data.towns}</strong></div>
              <div className="rounded bg-stone-50 p-2">cells: <strong>{res.data.cells}</strong></div>
              <div className="rounded bg-stone-50 p-2">pack-covered: <strong>{res.data.pack_covered_towns}</strong></div>
              <div className="rounded bg-stone-50 p-2">agenda open: <strong>{res.data.agenda_open}</strong></div>
            </div>
            <p className="mt-2 text-xs text-stone-600">stances: {JSON.stringify(res.data.stance_counts)}</p>
            <p className="mt-1 text-xs text-stone-600">reality-fact classes: {JSON.stringify(res.data.evidence_class_counts)}</p>
            <p className="mt-1 text-xs text-stone-600">
              recomputed from towns: {JSON.stringify(rollupProvince(full.data, res.data.province).stance_counts)} — must match stored rollup (validated in tests).
            </p>
            <ul className="mt-2 text-xs text-stone-700">
              {res.data.active_cells.map((a, i) => <li key={i} className="border-b border-stone-100 py-1">· {a.town} / {a.initiative} = {a.stance}</li>)}
            </ul>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">Towns in {res.data.province}</h2>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
              {full.data.towns.filter((t) => t.province === res.data!.province).map((t) => (
                <Link key={t.slug} href={`/passport/town/${t.slug}`} className="rounded border border-stone-200 px-2 py-1.5 text-xs hover:bg-stone-50">
                  {t.name}<div className="text-[10px] text-stone-400">{t.passport_status} · v{t.version}</div>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="rounded-lg border border-stone-300 bg-stone-50 p-4 text-sm text-stone-700">
          PROVINCE DATA UNAVAILABLE — {res.state_note} No content is shown; none is invented.
        </div>
      )}

      <footer className="pb-8 text-[11px] text-stone-500">
        Read-only intelligence view. <Link className="underline" href="/passport">National rollup</Link>
      </footer>
    </main>
  );
}
