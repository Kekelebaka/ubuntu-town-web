// src/lib/pulse/types.ts — Ubuntu Town OS Pulse engine (derived/read intelligence layer)
// ONE operating truth: every Pulse level is a PROJECTION of the same canonical rows
// (signals / work / proofs / learning / opportunity / memory). No Pulse-level records
// are stored anywhere — this layer never writes.

export type ScopeKind = "national" | "province" | "town" | "initiative" | "person";

/** Canonical input rows (shapes mirror uto tables; ids reference real rows). */
export interface SignalRow { id: string; town_id: string; initiative: string | null; created_by: string | null; created_at: string; status: string }
export interface WorkRow { id: string; town_id: string; initiative: string | null; created_by: string | null; created_at: string; updated_at: string; status: string } // draft|submitted|approved|published|rejected
export interface ProofRow { id: string; town_id: string; initiative: string | null; work_id: string | null; created_at: string; state: string } // captured|verified|disputed
export interface LearningRow { id: string; town_id: string; initiative: string | null; source_proof_id: string | null; created_at: string; text: string }
export interface OpportunityRow { id: string; town_id: string; initiative: string | null; status: string; created_at: string } // open|matched|closed
export interface MemoryRow { id: string; town_id: string | null; initiative: string | null; created_at: string; text: string }

export interface PulseDataset {
  signals: SignalRow[];
  works: WorkRow[];
  proofs: ProofRow[];
  learnings: LearningRow[];
  opportunities: OpportunityRow[];
  memories: MemoryRow[];
}

export const WORK_OPEN_STATES = ["draft", "submitted", "approved"] as const;

/** Signal → interpretation → evidence → capability implication → next action → owner → review. */
export interface PulseStatement {
  kind: "signal" | "insufficient_evidence";
  interpretation: string;
  evidence: string[];              // exact canonical row ids — never invented
  capabilityImplication: string | null;
  nextAction: { action: string; owner: string; reviewPoint: string } | null;
  owner: string | null;
  reviewPoint: string | null;
  reason?: string;                 // required when kind = insufficient_evidence
}

export interface PulseMetrics {
  signals: number;
  workOpen: number;
  workPublished: number;
  proofsCaptured: number;
  proofCaptureRate: number | null; // null = INSUFFICIENT EVIDENCE (no published work)
  staleOpenWork: number;           // open work untouched > 14 days
  peopleActive: number;            // distinct actors in this scope's rows
}

export interface PulseNode {
  scope: { kind: ScopeKind; id: string; label: string };
  metrics: PulseMetrics;
  statements: PulseStatement[];
  children: PulseNode[];            // projections of the same truth, one level down
  evidence: { workIds: string[]; proofIds: string[]; signalIds: string[]; learningIds: string[]; opportunityIds: string[] };
}

/** ACT-mode proposal — consequential actions ALWAYS require human approval. */
export interface ActionProposal {
  status: "proposed" | "denied";
  requiresHumanApproval: true;
  action: string;
  targetScope: string;
  owner: string;
  reviewPoint: string;
  reason?: string;
}
