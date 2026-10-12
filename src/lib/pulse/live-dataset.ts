// src/lib/pulse/live-dataset.ts — READ-ONLY adapter: live canonical rows → PulseDataset.
// The Pulse engine stays derived/read-only and must never become a second source of truth:
// this module MAY ONLY SELECT. No insert/update/delete/upsert/remove/rpc calls exist here
// (enforced by src/tests/pulse-live-dataset.test.ts). All reads go through uto.* with the
// caller's own session — row-level security decides what is visible; this module never
// widens access.

import type { PulseDataset, SignalRow, WorkRow, ProofRow, LearningRow, OpportunityRow, MemoryRow } from './types';

/** Structural reader type — the app's typed Supabase client is narrowed to this
 *  (schema() is called with 'uto'; the generated Database type only models 'public'). */
export type UtoReader = { schema: (s: string) => any };
export function asUtoReader(client: unknown): UtoReader {
  return client as UtoReader;
}

/** Pure mappers (tested): live uto row shapes → PulseDataset rows. No invention:
 *  a missing column maps to null/absent — never to fabricated values. */
export function mapWorkRow(r: {
  id: string; town_id: string; initiative: string | null; created_by: string | null;
  created_at: string; updated_at: string | null; status: string;
}): WorkRow {
  return {
    id: r.id, town_id: r.town_id, initiative: r.initiative, created_by: r.created_by,
    created_at: r.created_at, updated_at: r.updated_at ?? r.created_at, status: r.status,
  };
}

export function mapSignalRow(r: {
  id: string; town_id: string; created_by: string | null; created_at: string; status: string;
}): SignalRow {
  // uto.signals has no initiative column — stays null, never inferred.
  return { id: r.id, town_id: r.town_id, initiative: null, created_by: r.created_by, created_at: r.created_at, status: r.status };
}

export function mapProofRow(r: {
  id: string; community_work_id: string | null; status: string; created_at: string;
}, workById: Map<string, WorkRow>): ProofRow {
  const work = r.community_work_id ? workById.get(r.community_work_id) : undefined;
  // proofs carry no town_id/initiative — they inherit from their canonical work row.
  return {
    id: r.id, work_id: r.community_work_id,
    town_id: work?.town_id ?? '', initiative: work?.initiative ?? null,
    created_at: r.created_at, state: r.status,
  };
}

export function mapMemoryRow(r: {
  id: string; town_id: string | null; subject_type: string | null; subject_id: string | null;
  summary: string | null; created_at: string;
}): LearningRow {
  return {
    id: r.id, town_id: r.town_id ?? '', initiative: null, // memories carry no initiative column
    source_proof_id: r.subject_type === 'proof' ? r.subject_id : null,
    created_at: r.created_at, text: r.summary ?? '',
  };
}

export function mapOpportunityRow(r: {
  id: string; town_id: string; status: string; created_at: string;
}): OpportunityRow {
  return { id: r.id, town_id: r.town_id, initiative: null, status: r.status, created_at: r.created_at };
}

export function buildLiveDataset(input: {
  works: WorkRow[]; signals: SignalRow[]; proofs: ProofRow[]; learnings: LearningRow[];
  opportunities: OpportunityRow[]; memories: MemoryRow[];
}): PulseDataset {
  return input;
}

/** Thin live fetch layer — SELECT ONLY, uto schema, caller's session (RLS enforced).
 *  `supabase` is the app's server client (supabase-js); every call below is .select(). */
export async function loadLiveTownDataset(
  supabase: UtoReader,
  townId: string
): Promise<PulseDataset> {
  const uto = supabase.schema('uto');

  const { data: workData } = await uto
    .from('community_work')
    .select('id, town_id, initiative, created_by, created_at, updated_at, status')
    .eq('town_id', townId)
    .is('deleted_at', null);
  const works: WorkRow[] = ((workData ?? []) as Parameters<typeof mapWorkRow>[0][]).map(mapWorkRow);
  const workById = new Map<string, WorkRow>(works.map((w: WorkRow) => [w.id, w] as [string, WorkRow]));

  const { data: signalData } = await uto
    .from('signals')
    .select('id, town_id, created_by, created_at, status')
    .eq('town_id', townId);
  const signals: SignalRow[] = ((signalData ?? []) as Parameters<typeof mapSignalRow>[0][]).map(mapSignalRow);

  let proofs: ProofRow[] = [];
  if (works.length > 0) {
    const { data: proofData } = await uto
      .from('proofs')
      .select('id, community_work_id, status, created_at')
      .in('community_work_id', works.map((w: WorkRow) => w.id));
    proofs = ((proofData ?? []) as Parameters<typeof mapProofRow>[0][]).map((r) => mapProofRow(r, workById));
  }

  const { data: memData } = await uto
    .from('memories')
    .select('id, town_id, subject_type, subject_id, summary, created_at')
    .eq('town_id', townId);
  const learnings: LearningRow[] = ((memData ?? []) as Parameters<typeof mapMemoryRow>[0][]).map(mapMemoryRow);

  const { data: oppData } = await uto
    .from('opportunity_points')
    .select('id, town_id, status, created_at')
    .eq('town_id', townId);
  const opportunities: OpportunityRow[] = ((oppData ?? []) as Parameters<typeof mapOpportunityRow>[0][]).map(mapOpportunityRow);

  return buildLiveDataset({
    works, signals, proofs, learnings, opportunities,
    memories: [] as MemoryRow[], // memory rows surface as learnings above (subject-mapped)
  });
}

/** Display names for evidence cards (town-scoped read; RLS decides visibility). */
export async function loadTownPeople(
  supabase: UtoReader,
  townId: string
): Promise<Map<string, string>> {
  const { data } = await supabase.schema('uto')
    .from('coordinators')
    .select('id, display_name')
    .eq('town_id', townId);
  return new Map((data ?? []).map((c: { id: string; display_name: string | null }) => [c.id, c.display_name ?? c.id]));
}

/** The viewer's own assignments (self-read; the app's existing primitive). */
export async function loadViewerAssignments(
  supabase: UtoReader,
  userId: string
): Promise<{ user_id: string; role_key: string; town_id: string | null }[]> {
  const { data } = await supabase.schema('uto')
    .from('role_assignments')
    .select('user_id, role_key, town_id')
    .eq('user_id', userId);
  return data ?? [];
}

/** The viewer's town row (name/province) — geography display only, no roster inference. */
export async function loadTownRow(
  supabase: UtoReader,
  townId: string
): Promise<{ id: string; name: string; province: string } | null> {
  const { data } = await supabase.schema('uto')
    .from('towns')
    .select('id, name, province')
    .eq('id', townId)
    .maybeSingle();
  return data ?? null;
}
