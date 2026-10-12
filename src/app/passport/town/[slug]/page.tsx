// /passport/town/[slug] — Town Passport read view (15 sections). READ-ONLY.
// Every claim keeps provenance; every value keeps truth class; no fabricated fallback content.

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createSupabaseClient } from '@/supabase-clients/server';
import { loadViewerAssignments } from '@/lib/pulse/live-dataset';
import { loadTown } from '@/lib/passport/repository';
import { interpretTown } from '@/lib/passport/interpretation';
import { dataStateLine } from '@/lib/passport/rollups';
import type { PassportFact } from '@/lib/passport/types';

export const dynamic = 'force-dynamic';

function Badge({ truth }: { truth: string }) {
  const tone = truth === 'VERIFIED' || truth === 'ACTUAL' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : truth === 'MODELLED' || truth === 'HYPOTHESIS' || truth === 'BLUEPRINT_ASSUMPTION' ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
    : truth === 'FIELD_TO_VERIFY' ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-stone-100 text-stone-600 border-stone-300';
  return <span className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${tone}`}>{truth}</span>;
}

function FactRow({ f }: { f: PassportFact }) {
  return (
    <li className="border-b border-stone-100 py-2">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge truth={f.truth_class} />
        <code className="text-[10px] text-stone-400">{f.id}</code>
        <span className="text-[10px] text-stone-400">prov: {f.provenance}{f.source_kind ? ` · ${f.source_kind}` : ''} · as_of {f.as_of}</span>
      </div>
      <p className="mt-1 text-sm text-stone-800">{f.statement}</p>
      {f.value !== null && f.value !== undefined && (
        <p className="text-xs text-stone-600">value: {String(f.value)} {f.unit ?? ''}</p>
      )}
      <p className="mt-0.5 text-[10px] text-stone-400">
        evidence: {f.evidence_refs.length > 0 ? f.evidence_refs.map((e) => <code key={e} className="mr-1 rounded bg-amber-50 px-1 border border-amber-200">{e}</code>) : 'none recorded'}
      </p>
    </li>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-lg border border-stone-200 bg-white p-4">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-700">{title}</h2>
      {children}
    </section>
  );
}

export default async function TownPassportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(`/login?next=/passport/town/${slug}`);

  // Scope law: scope before person. Town passport is visible to scoped town members and
  // national-scope holders only. Out-of-scope renders an explicit state — never other towns' content.
  const assignments = await loadViewerAssignments(supabase as never, auth.user.id);
  const res = await loadTown(slug);
  const town = res.data;
  const nationalScope = assignments.some((a) => a.town_id === null);
  const townScoped = town ? assignments.some((a) => a.town_id === town.town_id) : false;

  if (town && !nationalScope && !townScoped) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-xl font-bold text-stone-900">Town Passport — {town.name}</h1>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          OUT OF SCOPE: your role assignments do not cover {town.name}. No passport content is shown.
          (scope-before-person law; RLS and the application authorization model remain the operational authority)
        </div>
      </main>
    );
  }

  if (!town) {
    return (
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        <h1 className="text-xl font-bold text-stone-900">Town Passport</h1>
        <div className="rounded-lg border border-stone-300 bg-stone-50 p-4 text-sm text-stone-700">
          {dataStateLine(res)} — no passport content to show. Content is not invented for missing artifacts.
        </div>
      </main>
    );
  }

  const interp = interpretTown(town);
  const engine = null; // per-initiative engine content shown inline below via town.cells

  return (
    <main className="mx-auto max-w-5xl space-y-4 p-4 md:p-6">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold text-stone-900">Town Passport — {town.name}</h1>
        <span className="text-xs text-stone-500">{town.passport_id} · v{town.version} · {town.passport_status}</span>
      </header>
      <div className="rounded border border-stone-300 bg-stone-50 p-2 text-[11px] text-stone-600">{dataStateLine(res)}</div>

      <Section id="identity" title="00 Identity">
        <ul className="grid grid-cols-1 gap-1 text-sm text-stone-800 sm:grid-cols-2">
          <li>Province: {town.identity.province as string}</li>
          <li>Municipality: {(town.identity.municipality as string) ?? <Badge truth="FIELD_TO_VERIFY" />}</li>
          <li>Archetype: {(town.identity.archetype as string) ?? <Badge truth="INSUFFICIENT_EVIDENCE" />}</li>
          <li>Anchor role: {(town.identity.anchor_role as string) ?? <Badge truth="INSUFFICIENT_EVIDENCE" />}</li>
        </ul>
        <p className="mt-2 text-[11px] text-stone-500">{town.identity.cohort_note}</p>
      </Section>

      <Section id="reality" title="01 Town Reality (People · Place · Economy · Network · Digital · Readiness)">
        {Object.entries(town.reality).map(([domain, facts]) => (
          <div key={domain} className="mb-3">
            <h3 className="text-xs font-semibold text-stone-600">{domain}</h3>
            <ul>{facts.map((f) => <FactRow key={f.id} f={f} />)}</ul>
          </div>
        ))}
      </Section>

      <Section id="opportunity" title="02 Opportunity">
        {town.opportunities.map((o) => (
          <div key={o.id} className="mb-2 border-b border-stone-100 pb-2">
            <div className="flex items-center gap-2"><Badge truth={o.truth_class} /><code className="text-[10px] text-stone-400">{o.id}</code><span className="text-xs text-stone-500">status: {o.status}</span></div>
            <p className="mt-1 text-sm">{o.how_we_know}</p>
            <p className="text-xs text-stone-600">next decision: {o.next_decision_question}</p>
            {o.market_layers.length > 0 && (
              <p className="mt-1 text-[11px] text-stone-500">market ladder: {o.market_layers.map((m) => `${m.layer}=${m.value === null ? m.truth_class : m.value}`).join(' · ')} — {o.market_layers[0]?.reason ?? ''}</p>
            )}
          </div>
        ))}
      </Section>

      <Section id="initiative-fit" title="03 Initiative Fit (10 cells · SCALE/BUILD/TEST/OBSERVE)">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead><tr className="border-b border-stone-300 text-stone-500"><th className="py-1">initiative</th><th>stance</th><th>fit</th><th>readiness</th><th>deployment</th><th>basis (why · evidence · what would change)</th></tr></thead>
            <tbody>
              {town.cells.map((c) => (
                <tr key={c.cell_id} className="border-b border-stone-100 align-top">
                  <td className="py-1.5 pr-2 font-medium text-stone-800">{c.initiative_key}</td>
                  <td className="pr-2"><span className={`rounded border px-1.5 py-0.5 text-[10px] ${c.stance === 'OBSERVE' ? 'border-stone-300 text-stone-500' : 'border-amber-300 bg-amber-50 text-amber-800'}`}>{c.stance}</span></td>
                  <td className="pr-2">{c.fit_verdict}</td>
                  <td className="pr-2">{c.readiness_verdict}</td>
                  <td className="pr-2">{c.deployment_decision}</td>
                  <td className="text-stone-600">
                    {c.basis.why ?? c.basis.rationale}
                    <div className="mt-0.5 text-[10px] text-stone-400">
                      evidence: {c.evidence_refs.length ? c.evidence_refs.map((e) => <code key={e} className="mr-1 rounded bg-amber-50 px-1 border border-amber-200">{e}</code>) : 'INSUFFICIENT EVIDENCE'} ·
                      would-change: {c.basis.what_would_change_the_decision ?? '—'}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="north-star" title="04 North Star & Targets">
        <div className="flex items-start gap-2"><Badge truth={town.north_star.truth_class} /><p className="text-sm">{town.north_star.statement}</p></div>
        <p className="mt-2 text-xs text-stone-600">Targets committed: {town.targets.length} — targets require verified baselines (09_TARGET_METHODOLOGY); none are invented here.</p>
      </Section>

      <Section id="capability" title="05 People & Capability">
        <p className="text-sm"><Badge truth="RECORDS_NOT_ACCESSIBLE" /> <span className="ml-1">{town.capability.capacity_notes}</span></p>
        <ul className="mt-2 text-xs text-stone-600">{town.capability.capability_gaps.map((g, i) => <li key={i}>· {g.gap} <Badge truth={g.class} /></li>)}</ul>
      </Section>

      <Section id="trajectory" title="06 90-Day Trajectory">
        <h3 className="text-xs font-semibold text-stone-600">First actions</h3>
        <ul className="text-sm text-stone-800">{town.trajectory.first_actions.map((a, i) => <li key={i}>· {a}</li>)}</ul>
        <h3 className="mt-2 text-xs font-semibold text-stone-600">Coordinator Day-1 workpacks (defined, NOT executed)</h3>
        <ul className="text-xs text-stone-700">
          {town.workpacks.day1.map((w) => (
            <li key={w.id} className="border-b border-stone-100 py-1">
              <code className="text-[10px] text-stone-400">{w.id}</code> — {w.what}
              <div className="text-[10px] text-stone-500">owner: {w.owner} · due {w.due} · unlocks: {w.decision_unlocked}</div>
            </li>
          ))}
          {town.workpacks.day1.length === 0 && <li className="text-stone-500">none queued for DAY 1</li>}
        </ul>
        <p className="mt-1 text-[11px] text-stone-500">schedule: {Object.entries(town.workpacks.groups).map(([g, ids]) => `${g}=${ids.length}`).join(' · ')}</p>
        <h3 className="mt-2 text-xs font-semibold text-stone-600">Next decisions</h3>
        <ul className="text-xs text-stone-700">{town.trajectory.next_decisions.map((n, i) => <li key={i}>· {n.what} <span className="text-stone-400">({n.who})</span></li>)}</ul>
      </Section>

      <Section id="bmc" title="07 BMC Hypotheses (E003 grammar: HYPOTHESIS · EVIDENCE · STATUS · EXPERIMENT · LEARNING)">
        {town.cells.filter((c) => c.stance !== 'OBSERVE').length === 0 ? (
          <p className="text-sm text-stone-600"><Badge truth="INSUFFICIENT_EVIDENCE" /> <span className="ml-1">No active initiative cell in {town.name} — the Business Model Canvas is not instantiated (all cells OBSERVE). Nothing is fabricated to fill the canvas.</span></p>
        ) : (
          town.cells.filter((c) => c.stance !== 'OBSERVE').map((c) => (
            <div key={c.cell_id} className="mb-2">
              <h3 className="text-xs font-semibold text-stone-700">{c.initiative_key} — {c.stance}</h3>
              <p className="text-xs text-stone-600">all 9 BMC blocks: status ASSUMED (pre-evidence) · hypothesis seed: {c.basis.why ?? c.basis.rationale}</p>
              <p className="text-[10px] text-stone-400">blocks: CUSTOMER_SEGMENTS · VALUE_PROPOSITION · CHANNELS · CUSTOMER_RELATIONSHIPS · REVENUE_STREAMS · KEY_RESOURCES · KEY_ACTIVITIES · KEY_PARTNERS · COST_STRUCTURE</p>
            </div>
          ))
        )}
      </Section>

      <Section id="proof" title="08 Proof">
        {town.proof_learning.proof_requirements.length === 0 ? (
          <p className="text-sm text-stone-600"><Badge truth="INSUFFICIENT_EVIDENCE" /> no active-cell proof requirements; verification proofs only (see Verification Agenda).</p>
        ) : (
          town.proof_learning.proof_requirements.map((p) => (
            <div key={p.initiative_key} className="text-xs text-stone-700">
              <span className="font-semibold">{p.initiative_key}:</span> {p.requirements.length} proof requirement(s) per Session-02 proof framework
            </div>
          ))
        )}
      </Section>

      <Section id="learning" title="09 Learning">
        {town.proof_learning.learnings.length === 0 ? (
          <p className="text-sm text-stone-600"><Badge truth="ABSENT" /> no learning records yet — learnings accrue from verification and proof cycles (never fabricated).</p>
        ) : (
          <ul className="text-sm">{town.proof_learning.learnings.map((l, i) => <li key={i}>· {String(l)}</li>)}</ul>
        )}
      </Section>

      <Section id="economics" title="10 Economics (MODEL · FORMULA · INPUTS · SOURCE · DATE · LIMITATION)">
        {town.economics.map((e, i) => (
          <div key={i} className="mb-2 border-b border-stone-100 pb-2 text-xs text-stone-700">
            <Badge truth={e.truth_class} />
            <p>model: {e.model ?? '—'} · formula: {e.formula ?? '—'} · source: {e.source} · date: {e.date}</p>
            <p>inputs: {e.inputs.length ? JSON.stringify(e.inputs).slice(0, 160) : 'none'}</p>
            <p className="text-stone-500">limitation: {e.limitation}</p>
          </div>
        ))}
      </Section>

      <Section id="agenda" title="11 Verification Agenda">
        <p className="text-xs text-stone-600">open: {town.agenda.summary.open} · verified: {town.agenda.summary.verified} · refuted: {town.agenda.summary.refuted} · records-not-accessible: {town.agenda.summary.records_not_accessible} · absent: {town.agenda.summary.absent_confirmed}</p>
        <ul className="mt-2">
          {town.agenda.entries.slice(0, 12).map((e) => (
            <li key={e.id} className="border-b border-stone-100 py-1 text-xs">
              <Badge truth={e.class} /> <code className="text-[10px] text-stone-400">{e.id}</code> {e.statement}
              <div className="text-[10px] text-stone-500">{e.method} · {e.owner} · priority {e.priority}</div>
            </li>
          ))}
          {town.agenda.entries.length > 12 && <li className="pt-1 text-[11px] text-stone-500">+{town.agenda.entries.length - 12} more entries in the artifact</li>}
        </ul>
      </Section>

      <Section id="what-changed" title="12 What Changed (versioning)">
        <p className="text-xs text-stone-600">passport {town.passport_id} v{town.version} · compiled {town.version_info.compiled_at} · artifacts sha256-pinned ({Object.keys(town.version_info.artifacts).length} files)</p>
        <ul className="mt-1 text-xs text-stone-600">
          <li>· v1.0.0 2026-10-11: initial 50-town baseline compilation + QA</li>
          <li>· v1.0.0 2026-10-12: coordinator workpacks added (verification programme)</li>
          <li>· v1.0.0 2026-10-12: read integration into Ubuntu Town OS (this view)</li>
        </ul>
        <p className="mt-1 text-[11px] text-stone-500">roster: {town.version_info.roster_ratification}</p>
      </Section>

      <Section id="cos" title="13 Chief of Staff Interpretation (evidence-linked · proposals only)">
        <ul className="space-y-2">
          {interp.claims.map((c, i) => (
            <li key={i} className="rounded border border-stone-200 p-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${c.mode === 'ACT' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-sky-50 text-sky-800 border border-sky-200'}`}>{c.mode}</span>
                <span className={`text-[10px] ${c.evidence_state === 'SUFFICIENT' ? 'text-emerald-700' : 'text-amber-700'}`}>{c.evidence_state}</span>
                {c.truth_class && <Badge truth={c.truth_class} />}
              </div>
              <p className="mt-1 text-sm text-stone-800">{c.claim}</p>
              <p className="mt-0.5 text-[10px] text-stone-400">evidence: {c.evidence.map((e) => <code key={e} className="mr-1 rounded bg-amber-50 px-1 border border-amber-200">{e}</code>)}{c.note ? ` · ${c.note}` : ''}</p>
            </li>
          ))}
        </ul>
        <h3 className="mt-3 text-xs font-semibold text-stone-600">Signal → Interpretation → Evidence → Capability implication → Next action → Owner → Review</h3>
        <ul className="mt-1 space-y-1">
          {interp.bridge.map((b, i) => (
            <li key={i} className="rounded bg-stone-50 p-2 text-[11px] text-stone-700">
              <strong>{b.signal}</strong> ⇒ {b.interpretation} ⇒ [{b.evidence.join(', ')}] ⇒ {b.capability_implication} ⇒ {b.next_action} ⇒ {b.owner} ⇒ review: {b.review}
            </li>
          ))}
        </ul>
        <h3 className="mt-3 text-xs font-semibold text-stone-600">Proposed actions — proposals only; every consequential action requires human approval</h3>
        <ul className="mt-1 space-y-1">
          {interp.proposals.map((p, i) => (
            <li key={i} className="rounded border border-red-200 bg-red-50 p-2 text-xs text-stone-800">
              <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-800">{p.approval_status}</span>
              <p className="mt-1">{p.proposal}</p>
              <p className="text-[10px] text-stone-500">owner: {p.owner} · rationale: {p.rationale} · evidence: {p.evidence.join(', ')} · review: {p.review_point}</p>
            </li>
          ))}
        </ul>
      </Section>

      <footer className="pb-8 text-[11px] text-stone-500">
        Read-only intelligence view. Ubuntu Town OS remains the operational system; this page writes nothing.
        Operational events are governed by the canonical application data model and authorization system (RLS decides).
        {' '}<Link className="underline" href="/passport">National rollup</Link>
      </footer>
    </main>
  );
}
