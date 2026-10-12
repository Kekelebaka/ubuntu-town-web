// src/data/learnings/learnings.ts — APPLICATION LEARNING WRITE PATH (server action).
//
// OUTCOME -> LEARNING -> uto.learnings -> PASSPORT/BMC DELTA -> NEXT DECISION.
//
// Writes a governed learning record under the signed-in user's session so the DATABASE RLS
// (uto.learnings policies) is the authority — no service-role, no RLS bypass, no fabricated
// outcomes. The pure rules live in src/lib/learnings/write.ts; this resolves the actor's real
// scope from the database and performs the RLS-enforced insert.

'use server';

import { createSupabaseClient } from '@/supabase-clients/server';
import {
  buildLearningRecord,
  buildSupersedingLearning,
  LearningInput,
  LearningRecord,
  ActorScope,
} from '@/lib/learnings/write';

/** Resolve the actor's scope from role_assignments + profile facts (fail-closed: no rows = no scope). */
async function resolveActorScope(userId: string): Promise<ActorScope> {
  const supabase = await createSupabaseClient();

  const { data: ras, error: raErr } = await (supabase as any)
    .schema('uto')
    .from('role_assignments')
    .select('town_id, role_key')
    .eq('user_id', userId);
  if (raErr) throw new Error(`scope resolution failed: ${raErr.message}`);

  const rows = (ras ?? []) as { town_id: string | null; role_key: string }[];
  const isNational = rows.some((r) => ['admin', 'ops'].includes(r.role_key) && r.town_id == null);
  const townIds = rows.map((r) => r.town_id).filter((t): t is string => !!t);

  const { data: prof } = await (supabase as any)
    .schema('uto')
    .from('profiles')
    .select('facts')
    .eq('id', userId)
    .maybeSingle();
  const scopeObj = (prof as any)?.facts?.initiative_scope;
  const initiativeKeys = Array.isArray(scopeObj)
    ? scopeObj.map(String)
    : scopeObj && typeof scopeObj === 'object'
      ? Object.keys(scopeObj)
      : [];

  return { userId, isNational, townIds, initiativeKeys };
}

/**
 * Create a governed learning record. Validates the record (statement, truth class,
 * evidence-or-authored, provenance, distinct deltas, author-self, town/initiative scope) then
 * inserts under the user's session so RLS enforces the boundary at the database.
 */
export async function createLearning(input: LearningInput): Promise<{ id: string }> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error('User not logged in');

  const actor = await resolveActorScope(userId);
  const record: LearningRecord = buildLearningRecord(input, actor);

  const { data: inserted, error: insErr } = await (supabase as any)
    .schema('uto')
    .from('learnings')
    .insert(record)
    .select('id')
    .single();
  if (insErr) throw new Error(`learning insert denied: ${insErr.message}`);

  return { id: (inserted as any).id };
}

/**
 * Supersede (correct) a learning: creates a NEW versioned row linked via `supersedes`. The
 * original is never mutated (DB trigger enforces immutability).
 */
export async function supersedeLearning(
  previousId: string,
  correction: LearningInput,
): Promise<{ id: string; version: number }> {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) throw new Error('User not logged in');

  const { data: prev, error: prevErr } = await (supabase as any)
    .schema('uto')
    .from('learnings')
    .select('id, version, author_id')
    .eq('id', previousId)
    .single();
  if (prevErr || !prev) throw new Error('prior learning not found or not visible');

  const actor = await resolveActorScope(userId);
  const next = buildSupersedingLearning({ id: (prev as any).id, version: (prev as any).version }, correction, actor);

  const { data: inserted, error: insErr } = await (supabase as any)
    .schema('uto')
    .from('learnings')
    .insert(next)
    .select('id, version')
    .single();
  if (insErr) throw new Error(`superseding learning denied: ${insErr.message}`);

  return { id: (inserted as any).id, version: (inserted as any).version };
}
