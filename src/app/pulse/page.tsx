import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseClient } from '@/supabase-clients/server';
import { computeView, projectMode, type PulseMode } from '@/lib/pulse/engine';
import { buildScopeTree, type InitiativeRow } from '@/lib/pulse/scope-resolver';
import { personProjection } from '@/lib/pulse/reducers';
import {
  loadLiveTownDataset, loadTownPeople, loadViewerAssignments, loadTownRow, asUtoReader,
} from '@/lib/pulse/live-dataset';
import type { PulseStatement } from '@/lib/pulse/types';

export const metadata = { title: 'Ubuntu Town Pulse' };
export const dynamic = 'force-dynamic';

const MODES: { key: PulseMode; question: string }[] = [
  { key: 'OBSERVE', question: 'What is happening?' },
  { key: 'EXPLAIN', question: 'What does the evidence suggest is happening?' },
  { key: 'CHALLENGE', question: 'What assumption, bottleneck or anomaly deserves attention?' },
  { key: 'COACH', question: 'What capability or intervention may be required?' },
  { key: 'ACT', question: 'What next action is proposed?' },
];

function EvidenceChips({ ids }: { ids: string[] }) {
  if (ids.length === 0) return <span className="text-xs text-stone-400">no evidence rows</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {ids.slice(0, 8).map((id) => (
        <code key={id} className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-800 border border-amber-200">{id}</code>
      ))}
      {ids.length > 8 && <span className="text-[10px] text-stone-500">+{ids.length - 8} more</span>}
    </span>
  );
}

function StatementCard({ s }: { s: PulseStatement }) {
  const insufficient = s.kind === 'insufficient_evidence';
  return (
    <div className={`rounded-xl border p-4 ${insufficient ? 'border-rose-200 bg-rose-50/50' : 'border-stone-200 bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-stone-800">{s.interpretation}</p>
        {insufficient ? (
          <span className="shrink-0 rounded-full border border-rose-300 px-2 py-0.5 text-[10px] font-semibold text-rose-700">INSUFFICIENT EVIDENCE</span>
        ) : (
          <span className="shrink-0 rounded-full border border-emerald-300 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">EVIDENCE-LINKED</span>
        )}
      </div>
      {s.reason && <p className="mt-1 text-xs text-rose-700">{s.reason}</p>}
      {s.capabilityImplication && (
        <p className="mt-2 text-xs text-stone-600"><span className="font-semibold">Capability:</span> {s.capabilityImplication}</p>
      )}
      <div className="mt-2"><EvidenceChips ids={s.evidence} /></div>
      {s.nextAction && (
        <p className="mt-2 text-xs text-stone-600">
          <span className="font-semibold">Next:</span> {s.nextAction.action} · <span className="font-semibold">Owner:</span> {s.nextAction.owner} · <span className="font-semibold">Review:</span> {s.nextAction.reviewPoint}
        </p>
      )}
    </div>
  );
}

export default async function PulsePage({ searchParams }: { searchParams: Promise<{ scope?: string }> }) {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=%2Fpulse');

  const assignments = await loadViewerAssignments(asUtoReader(supabase), user.id);
  const townId = assignments.find((a) => a.town_id)?.town_id ?? null;

  if (!townId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-bold text-stone-900">Ubuntu Town Pulse</h1>
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/60 p-6">
          <p className="rounded-full border border-rose-300 px-2 py-0.5 text-[10px] font-semibold text-rose-700 inline-block">INSUFFICIENT EVIDENCE</p>
          <p className="mt-3 text-sm text-stone-700">No town scope is assigned to your identity yet (scope before person). A town lead or national operator must grant a scope before Pulse can see the town.</p>
          <p className="mt-2 text-xs text-stone-500">Evidence: role_assignments rows for your user — none with a town scope.</p>
        </div>
      </main>
    );
  }

  const uto = asUtoReader(supabase);
  const [ds, people, townRow] = await Promise.all([
    loadLiveTownDataset(uto, townId),
    loadTownPeople(uto, townId),
    loadTownRow(uto, townId),
  ]);

  const now = Date.now();
  const initiatives: InitiativeRow[] = Array.from(new Set(
    ds.works.map((w) => w.initiative).filter((x): x is string => x !== null)
  )).map((name) => ({ id: name, name, town_id: townId }));
  const tree = buildScopeTree(
    [{ id: townId, name: townRow?.name ?? 'My Town', province: townRow?.province ?? '', is_founding: true }],
    initiatives
  );
  const viewer = { userId: user.id, assignments };

  const params = await searchParams;
  const requestedScope = params.scope ?? `town:${townId}`;
  const view = computeView(ds, tree, viewer, requestedScope, now);

  const isPerson = requestedScope.startsWith('person:');
  const node = view.status === 'ok' && view.node ? view.node : null;
  const person = view.status === 'ok' && view.person ? view.person : null;
  const statements = node?.statements ?? person?.statements ?? [];
  const scopeLabel = node?.scope.label ?? (person ? people.get(person.personId) ?? person.personId : requestedScope);

  const actRows = statements
    .filter((s) => s.nextAction !== null)
    .map((s) => ({
      action: s.nextAction!.action,
      owner: s.nextAction!.owner,
      rationale: s.capabilityImplication ?? s.interpretation,
      evidence: s.evidence,
      reviewPoint: s.nextAction!.reviewPoint,
      approvalStatus: 'PROPOSED — PENDING HUMAN APPROVAL',
    }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <p className="text-xs uppercase tracking-[0.2em] text-amber-700">Ubuntu Town OS · one operating brain</p>
      <h1 className="mt-1 text-3xl font-bold text-stone-900">Town Pulse — {scopeLabel}</h1>
      <p className="mt-1 text-sm text-stone-500">
        National → Province → {townRow?.province || 'Province'} → Blueprint Town → Initiative → Person/Role
        {' · '}<span className="text-stone-400">derived/read-only projection — every claim links to evidence</span>
      </p>

      {view.status === 'denied' ? (
        <div className="mt-6 rounded-xl border border-rose-200 bg-rose-50/60 p-6">
          <p className="text-sm font-semibold text-rose-700">Denied (fail-closed)</p>
          <p className="mt-1 text-xs text-stone-600">{(view as { reason: string }).reason}</p>
        </div>
      ) : (
        <>
          {/* Scope switcher — the same engine, different projections */}
          <nav className="mt-6 flex flex-wrap gap-2">
            <Link href="/pulse" className={`rounded-full border px-3 py-1 text-xs ${!params.scope ? 'border-amber-600 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-600'}`}>
              {townRow?.name ?? 'Town'} Pulse
            </Link>
            {initiatives.map((i) => (
              <Link key={i.id} href={`/pulse?scope=initiative:${encodeURIComponent(i.id)}`}
                className={`rounded-full border px-3 py-1 text-xs ${params.scope === `initiative:${i.id}` ? 'border-amber-600 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-600'}`}>
                {i.name}
              </Link>
            ))}
            {Array.from(new Set([...ds.works, ...ds.signals].map((r) => r.created_by).filter((x): x is string => x !== null))).slice(0, 6).map((p) => (
              <Link key={p} href={`/pulse?scope=person:${encodeURIComponent(p)}`}
                className={`rounded-full border px-3 py-1 text-xs ${params.scope === `person:${p}` ? 'border-amber-600 bg-amber-50 text-amber-800' : 'border-stone-200 text-stone-600'}`}>
                {people.get(p) ?? p.slice(0, 8)}
              </Link>
            ))}
          </nav>

          {/* Hierarchy rollup (when a town view) */}
          {node && node.children.length > 0 && (
            <section className="mt-8">
              <h2 className="text-sm font-semibold text-stone-700">Initiative cells (projections of the same truth)</h2>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {node.children.map((c) => (
                  <div key={c.scope.id} className="rounded-xl border border-stone-200 bg-white p-4">
                    <p className="text-sm font-semibold text-stone-800">{c.scope.label}</p>
                    <p className="mt-1 text-xs text-stone-500">
                      {c.metrics.workOpen} open · {c.metrics.workPublished} published · {c.metrics.proofsCaptured} proofs · {c.metrics.staleOpenWork} stalled
                    </p>
                    <p className="mt-1 text-xs text-stone-500">
                      proof capture: {c.metrics.proofCaptureRate === null ? <span className="text-rose-600 font-semibold">INSUFFICIENT EVIDENCE</span> : `${Math.round(c.metrics.proofCaptureRate * 100)}%`}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Five-mode acceptance contract */}
          {MODES.map(({ key, question }) => {
            const lines = projectMode(key, statements);
            return (
              <section key={key} className="mt-8">
                <div className="flex items-baseline gap-3">
                  <h2 className="text-lg font-bold text-stone-900">{key}</h2>
                  <p className="text-xs italic text-stone-500">{question}</p>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3">
                  {key === 'ACT' ? (
                    actRows.length === 0 ? (
                      <StatementCard s={{ kind: 'insufficient_evidence', interpretation: 'No action can be proposed from current evidence.', evidence: [], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null, reason: 'INSUFFICIENT EVIDENCE: nothing is actionable without supporting rows.' }} />
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-stone-200 bg-white">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-stone-50 text-stone-500">
                            <tr>
                              <th className="px-3 py-2">Action</th><th className="px-3 py-2">Owner</th>
                              <th className="px-3 py-2">Rationale</th><th className="px-3 py-2">Supporting evidence</th>
                              <th className="px-3 py-2">Review point</th><th className="px-3 py-2">Approval status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {actRows.map((r, i) => (
                              <tr key={i} className="border-t border-stone-100">
                                <td className="px-3 py-2 text-stone-800">{r.action}</td>
                                <td className="px-3 py-2 text-stone-600">{r.owner}</td>
                                <td className="px-3 py-2 text-stone-600">{r.rationale}</td>
                                <td className="px-3 py-2"><EvidenceChips ids={r.evidence} /></td>
                                <td className="px-3 py-2 text-stone-600">{r.reviewPoint}</td>
                                <td className="px-3 py-2"><span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">{r.approvalStatus}</span></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : lines.length === 0 ? (
                    <StatementCard s={{ kind: 'insufficient_evidence', interpretation: `Nothing to report for ${key.toLowerCase()} at this scope.`, evidence: [], capabilityImplication: null, nextAction: null, owner: null, reviewPoint: null, reason: 'INSUFFICIENT EVIDENCE for this mode at this scope.' }} />
                  ) : (
                    statements.map((s, i) => <StatementCard key={i} s={s} />)
                  )}
                </div>
              </section>
            );
          })}
        </>
      )}

      <footer className="mt-12 border-t border-stone-200 pt-4 text-[10px] text-stone-400">
        Ubuntu Town Pulse — ONE derived/read intelligence engine (National / Provincial / Town / Initiative / Person-Role are views of one truth).
        Read-only: this page never writes. Consequential actions require human approval. Production geography navigation = 9 provinces / 50 Blueprint towns.
      </footer>
    </main>
  );
}
