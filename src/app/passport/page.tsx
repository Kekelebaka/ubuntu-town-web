// /passport — national intelligence rollup (READ-ONLY). Town / Province / National cascade.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/supabase-clients/server';
import { loadViewerAssignments } from '@/lib/pulse/live-dataset';
import { loadNational, loadIntelligence } from '@/lib/passport/repository';
import { validateRollupConsistency, dataStateLine, rollupNational } from '@/lib/passport/rollups';

export const dynamic = 'force-dynamic';

export default async function PassportNationalPage() {
  const supabase = await createSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect('/login?next=/passport');

  const assignments = await loadViewerAssignments(supabase as never, auth.user.id);
  const res = await loadNational();
  const full = await loadIntelligence();
  const nationalScope = assignments.some((a) => a.town_id === null);

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <h1 className="text-2xl font-bold text-stone-900">Town Intelligence — National Rollup</h1>
      <div className="rounded border border-stone-300 bg-stone-50 p-2 text-[11px] text-stone-600">{dataStateLine(res)}</div>

      {!nationalScope && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          SCOPE NOTICE: you hold town-scoped assignment(s) only. Aggregate national figures below are
          compilation counts (artifact metadata), not operational person data. Town-level passports are
          limited to your scope (scope-before-person law).
        </div>
      )}

      {res.data && full.data ? (
        <>
          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">Counts (comparable units only — incompatible metrics are never summed)</h2>
            <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded bg-stone-50 p-2">towns: <strong>{String((res.data.counts as Record<string, unknown>).towns)}</strong></div>
              <div className="rounded bg-stone-50 p-2">cells: <strong>{String((res.data.counts as Record<string, unknown>).cells)}</strong></div>
              <div className="rounded bg-stone-50 p-2">artifacts: <strong>{String((res.data.counts as Record<string, unknown>).artifacts)}</strong></div>
              <div className="rounded bg-stone-50 p-2">schema pass: <strong>{String((res.data.counts as Record<string, unknown>).schema_pass)}/50</strong></div>
            </div>
            <p className="mt-2 text-xs text-stone-600">stances: {JSON.stringify((res.data.counts as Record<string, unknown>).stance_counts)} — SCALE/BUILD are 0 by evidence (no verified outcomes / no readiness evidence).</p>
            <p className="mt-1 text-xs text-stone-600">verification programme: {res.data.session04.items} items · {JSON.stringify(res.data.session04.by_bucket)}</p>
            <ul className="mt-2 text-xs text-stone-700">
              {res.data.session04.global_items.map((g) => (
                <li key={g.id} className="border-b border-stone-100 py-1">
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-800 border border-red-200">{g.group}</span>{' '}
                  <code className="text-[10px] text-stone-400">{g.id}</code> — {g.what.slice(0, 140)}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">Rollup consistency (town → province → national)</h2>
            {(() => {
              const v = validateRollupConsistency(full.data);
              return v.ok
                ? <p className="text-sm text-emerald-700">CONSISTENT: province rollups sum exactly to national; every town carries 10 cells.</p>
                : <ul className="text-sm text-red-700">{v.problems.map((p, i) => <li key={i}>· {p}</li>)}</ul>;
            })()}
            <p className="mt-2 text-xs text-stone-600">national recomputed: {JSON.stringify(rollupNational(full.data).stance_counts)}</p>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">Provinces (9)</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {full.data.provinces.map((p) => (
                <Link key={p.province} href={`/passport/province/${p.province.toLowerCase().replace(/ /g, '-')}`}
                  className="rounded border border-stone-200 p-3 hover:bg-stone-50">
                  <h3 className="text-sm font-semibold text-stone-800">{p.province}</h3>
                  <p className="text-[11px] text-stone-600">towns {p.towns} · cells {p.cells} · pack-covered {p.pack_covered_towns} · agenda open {p.agenda_open}</p>
                  <p className="text-[11px] text-stone-500">stances {JSON.stringify(p.stance_counts)}</p>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">Portfolio gaps (no canonical initiative owner)</h2>
            <ul className="text-xs text-stone-700">
              {res.data.portfolio_gaps.slice(0, 12).map((g, i) => <li key={i} className="border-b border-stone-100 py-1">{g.town}: {g.gap}</li>)}
            </ul>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">Towns</h2>
            <div className="grid grid-cols-2 gap-1 sm:grid-cols-3 md:grid-cols-5">
              {full.data.towns.map((t) => (
                <Link key={t.slug} href={`/passport/town/${t.slug}`} className="rounded border border-stone-200 px-2 py-1.5 text-xs hover:bg-stone-50">
                  {t.name}
                  <div className="text-[10px] text-stone-400">{t.cells.filter((c) => c.stance !== 'OBSERVE').length} active · {t.agenda.summary.open} open</div>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-4">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">What Changed</h2>
            <ul className="text-xs text-stone-700">
              {full.data.meta.what_changed.map((c, i) => <li key={i} className="border-b border-stone-100 py-1">v{c.version} {c.date}: {c.change}</li>)}
            </ul>
            <p className="mt-1 text-[11px] text-stone-500">{full.data.meta.freshness_policy}</p>
          </section>
        </>
      ) : (
        <div className="rounded-lg border border-stone-300 bg-stone-50 p-4 text-sm text-stone-700">
          INTELLIGENCE LAYER UNAVAILABLE — {res.state_note} No rollup content is shown; none is invented.
        </div>
      )}

      <footer className="pb-8 text-[11px] text-stone-500">
        Read-only. Ubuntu Town OS = operational system; AWS Town Intelligence = versioned artifact layer (this view).
      </footer>
    </main>
  );
}
