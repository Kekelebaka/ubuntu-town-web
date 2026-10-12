// src/lib/passport/types.ts — Town Passport read-integration view models.
// LAW: every claim keeps provenance; every value keeps truth class; no fabricated content in any state.

export type TruthClass =
  | 'VERIFIED' | 'ACTUAL' | 'MODELLED' | 'HYPOTHESIS' | 'BLUEPRINT_ASSUMPTION'
  | 'FIELD_TO_VERIFY' | 'INSUFFICIENT_EVIDENCE' | 'RECORDS_NOT_ACCESSIBLE' | 'ABSENT';

export type DataState = 'LIVE' | 'SNAPSHOT' | 'STALE' | 'UNAVAILABLE';

export interface EvidenceRef { id: string }

export interface PassportFact {
  id: string;
  statement: string;
  value: number | string | boolean | null;
  unit: string | null;
  truth_class: TruthClass;
  provenance: string;
  source_kind?: string | null;
  source_detail?: string | null;
  as_of: string;
  evidence_refs: string[];
}

export interface MarketLayerView {
  layer: string;
  value: number | null;
  truth_class: TruthClass;
  reason?: string | null;
}

export interface OpportunityView {
  id: string;
  how_we_know: string;
  next_decision_question: string;
  truth_class: TruthClass;
  status: string;
  market_layers: MarketLayerView[];
  provenance: Record<string, unknown>;
}

export interface CellView {
  cell_id: string;
  initiative_key: string;
  stance: 'SCALE' | 'BUILD' | 'TEST' | 'OBSERVE';
  fit_verdict: string;
  basis: { why?: string; rationale?: string; evidence?: string; assumptions?: string[]; what_would_change_the_decision?: string; mapping_class?: string };
  evidence_refs: string[];
  readiness_verdict: string;
  deployment_decision: string;
  unknowns: { statement: string; class: string }[];
}

export interface AgendaEntryView {
  id: string; domain: string; statement: string; class: TruthClass;
  method: string; owner: string; status: string; priority: string;
}

export interface WorkpackItemView {
  id: string; type: string; what: string; owner: string; decision_unlocked: string; due: string;
}

export interface TownPassportView {
  name: string; slug: string; province: string; town_id: string;
  passport_id: string; passport_status: string; version: string; as_of: string;
  identity: Record<string, unknown> & { cohort_note: string };
  reality: Record<string, PassportFact[]>;
  opportunities: OpportunityView[];
  cells: CellView[];
  north_star: { statement: string; truth_class: TruthClass; source: string };
  targets: unknown[];
  capability: { capability_matrix: unknown[]; capability_available_refs: unknown[]; capability_gaps: { gap: string; class: string }[]; capacity_notes: string };
  trajectory: {
    workpacks: { workpack_id?: string; title?: string; why_this_town?: string; priority?: string; proof_required?: string[]; source?: { kind: string; ref?: string } }[];
    first_actions: string[];
    next_decisions: { what: string; who: string }[];
    risks: { statement: string; truth_class: TruthClass }[];
    unknowns: { statement: string; class: string }[];
  };
  proof_learning: {
    proof_requirements: { initiative_key: string; requirements: unknown[] }[];
    evidence_refs: { source_system: string; id: string; as_of?: string }[];
    learnings: unknown[];
  };
  economics: { model: string | null; formula: string | null; inputs: unknown[]; source: string; date: string; limitation: string; truth_class: TruthClass }[];
  agenda: { summary: Record<string, number>; entries: AgendaEntryView[] };
  workpacks: { groups: Record<string, string[]>; day1: WorkpackItemView[]; by_type: Record<string, number> };
  version_info: { artifacts: Record<string, { sha256: string; bytes: number }>; compiled_at: string; roster_ratification: string };
}

export interface ProvinceRollupView {
  province: string; towns: number; cells: number;
  stance_counts: Record<string, number>;
  pack_covered_towns: number; agenda_open: number;
  active_cells: { town: string; initiative: string; stance: string }[];
  evidence_class_counts: Record<string, number>;
}

export interface NationalRollupView {
  counts: Record<string, unknown>;
  portfolio_gaps: { town: string; gap: string }[];
  session04: { items: number; by_bucket: Record<string, number>; global_items: { id: string; group: string; what: string }[] };
}

export interface SnapshotMeta {
  object: string; schema: string; version: string; generated_from: string;
  manifest_version: string; compiled_at: string; as_of: string;
  roster_ratification: string;
  source_priority: Record<string, string>;
  freshness_policy: string;
  what_changed: { version: string; date: string; change: string }[];
}

export interface PassportSnapshot {
  meta: SnapshotMeta;
  national: NationalRollupView;
  provinces: ProvinceRollupView[];
  towns: TownPassportView[];
  initiative_engines: Record<string, {
    canonical_name: string;
    proof_requirements: unknown[];
    learning_questions: string[];
    reward: Record<string, unknown>;
    funnel: Record<string, unknown>;
    bmc_blocks: string[];
    purpose: { statement?: string | null; truth_class?: string | null };
  }>;
}

/** Repository access result — the ONLY shape pages may consume. */
export interface RepositoryResult<T> {
  state: DataState;
  /** Explicit, human-readable data state. ALWAYS shown in the UI when not LIVE. */
  state_note: string;
  as_of: string;
  version: string;
  roster_ratification: string;
  data: T | null;
}
