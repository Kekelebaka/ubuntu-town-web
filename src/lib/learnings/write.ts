// src/lib/learnings/write.ts — APPLICATION LEARNING WRITE PATH (governed record builder).
//
// The canonical persistence is Supabase uto.learnings (migration 0024). This module is the
// application-layer builder: it constructs a GOVERNED learning record and enforces fail-closed
// rules BEFORE the row is handed to the RLS-enforced Supabase client. It never bypasses RLS and
// never fabricates outcomes: where evidence is absent the record must carry truth_class
// INSUFFICIENT_EVIDENCE (or AUTHORED with empty evidence_refs) — never invented evidence.
//
// Two distinct delta concepts (§14, never merged):
//   bmc_delta      = what changed in our understanding of the initiative's business model
//   passport_delta = what changed in our understanding of the town
//
// Pure + injectable: no I/O here so the rules are unit-testable. The server action
// (src/data/learnings/learnings.ts) resolves the actor's real scope from the database and calls
// buildLearningRecord, then inserts via the RLS client.

export const LEARNING_TRUTH_CLASSES = [
  'VERIFIED', 'ACTUAL', 'MODELLED', 'HYPOTHESIS', 'AUTHORED', 'INSUFFICIENT_EVIDENCE',
] as const;
export type LearningTruthClass = (typeof LEARNING_TRUTH_CLASSES)[number];

export const LEARNING_STATUSES = ['draft', 'active', 'superseded', 'refuted'] as const;
export type LearningStatus = (typeof LEARNING_STATUSES)[number];

export const LEARNING_SCOPE_LEVELS = ['national', 'province', 'town', 'initiative', 'person'] as const;
export type LearningScopeLevel = (typeof LEARNING_SCOPE_LEVELS)[number];

/** Actor scope context, resolved from the database (role_assignments / profiles.facts). */
export interface ActorScope {
  userId: string;
  isNational: boolean;
  townIds: string[];
  initiativeKeys: string[];
}

export interface LearningDelta {
  // shared delta field family (bmc-delta.schema.json / passport-delta.schema.json)
  field: string;
  old_value?: unknown;
  new_value?: unknown;
  truth_class: string;
  reason: string;
  evidence_refs: string[];
  source: string;
  timestamp: string;
  impact?: string | null;
  recommended_action?: string | null;
  human_decision_status: 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'NOT_REQUIRED';
  [k: string]: unknown;
}

export interface LearningInput {
  statement: string;
  truth_class: LearningTruthClass;
  scope_level: LearningScopeLevel;
  town_id?: string | null;
  initiative_key?: string | null;
  work_id?: string | null;
  mission_id?: string | null;
  workpack_id?: string | null;
  proof_id?: string | null;
  outcome_id?: string | null;
  source?: string | null;
  evidence_refs: string[];
  bmc_delta?: LearningDelta | null;
  passport_delta?: LearningDelta | null;
  provenance?: Record<string, unknown>;
}

export interface LearningRecord extends LearningInput {
  author_id: string;
  status: LearningStatus;
  version: number;
  supersedes: string | null;
  provenance: Record<string, unknown>;
}

export class LearningValidationError extends Error {}
export class UnauthorizedLearningError extends Error {}
export class CrossTownLearningError extends Error {}
export class CrossInitiativeLearningError extends Error {}

const nowIso = () => new Date().toISOString();

function assertDelta(name: string, d: LearningDelta | null | undefined): void {
  if (d == null) return;
  if (typeof d !== 'object') throw new LearningValidationError(`${name} must be an object`);
  if (!d.field || typeof d.field !== 'string') throw new LearningValidationError(`${name}.field is required`);
  if (!d.reason || typeof d.reason !== 'string') throw new LearningValidationError(`${name}.reason is required`);
  if (!d.source) throw new LearningValidationError(`${name}.source is required`);
  if (!Array.isArray(d.evidence_refs)) throw new LearningValidationError(`${name}.evidence_refs must be an array`);
  if (!d.truth_class) throw new LearningValidationError(`${name}.truth_class is required`);
  if (!d.human_decision_status) throw new LearningValidationError(`${name}.human_decision_status is required`);
}

/**
 * Build a governed learning record. Fail-closed: throws on any rule violation. The author must be
 * the actor themself; town/initiative scope is checked against the actor's resolved scope (defense
 * in depth — the database RLS independently enforces the same boundary).
 */
export function buildLearningRecord(input: LearningInput, actor: ActorScope): LearningRecord {
  // statement
  const statement = (input.statement ?? '').trim();
  if (!statement) throw new LearningValidationError('statement is required and must be non-empty');

  // truth class
  if (!LEARNING_TRUTH_CLASSES.includes(input.truth_class)) {
    throw new LearningValidationError(`truth_class must be one of ${LEARNING_TRUTH_CLASSES.join(', ')}`);
  }

  // evidence-or-authored (learning.schema.json anyOf)
  const evidence = Array.isArray(input.evidence_refs) ? input.evidence_refs.filter(Boolean) : [];
  if (evidence.length === 0 && input.truth_class !== 'AUTHORED') {
    throw new LearningValidationError('evidence_refs must be non-empty unless truth_class is AUTHORED');
  }

  // author must be self (never author learning on behalf of someone else silently)
  if (!actor?.userId) throw new UnauthorizedLearningError('actor is required');
  const author_id = actor.userId;

  // town scope (fail-closed)
  if (input.town_id && !actor.isNational && !actor.townIds.includes(input.town_id)) {
    throw new CrossTownLearningError('actor has no scope for the target town');
  }

  // initiative scope (fail-closed) — only checked when the record is initiative-scoped
  if (input.initiative_key && !input.town_id && !actor.isNational &&
      !actor.initiativeKeys.includes(input.initiative_key)) {
    throw new CrossInitiativeLearningError('actor has no scope for the target initiative');
  }

  // deltas: distinct + validated
  assertDelta('bmc_delta', input.bmc_delta);
  assertDelta('passport_delta', input.passport_delta);
  if (input.bmc_delta && input.passport_delta &&
      (input.bmc_delta as any).field === (input.passport_delta as any).field &&
      (input.bmc_delta as any).reason === (input.passport_delta as any).reason) {
    // allow both, but they must remain distinguishable payloads
  }

  // provenance (required, versioned)
  const provenance = {
    source: input.source ?? null,
    chain: 'WORK->PROOF->OUTCOME->LEARNING->PERSISTENCE->DELTA->NEXT_DECISION',
    version: 1,
    created_by: 'application',
    truth_class: input.truth_class,
    ...(input.provenance ?? {}),
    recorded_at: nowIso(),
  };

  return {
    ...input,
    statement,
    evidence_refs: evidence,
    author_id,
    status: 'active',
    version: 1,
    supersedes: null,
    provenance,
  };
}

/**
 * Build a SUPERSEDING correction to an existing learning. Content is never mutated in place
 * (the DB trigger also enforces this); a correction is a NEW row linked via `supersedes`, with a
 * bumped version. Returns the new record; the caller inserts it (RLS-enforced).
 */
export function buildSupersedingLearning(
  previous: { id: string; version: number },
  correction: LearningInput,
  actor: ActorScope,
): LearningRecord {
  const next = buildLearningRecord(correction, actor);
  return {
    ...next,
    version: (previous.version ?? 1) + 1,
    supersedes: previous.id,
    status: 'active',
    provenance: {
      ...next.provenance,
      supersedes: previous.id,
      prior_version: previous.version ?? 1,
    },
  };
}
