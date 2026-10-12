// src/lib/passport/interpretation.ts — Chief-of-Staff interpretation projection.
// DETERMINISTIC and evidence-linked (Pulse acceptance contract):
//   every claim links to evidence; INSUFFICIENT EVIDENCE is explicit; ACT outputs are PROPOSALS
//   only (owner, rationale, evidence, review point, approval status) — no consequential actions.
// This is a structured projection over the intelligence layer — never AI narrative.

import type { CellView, TownPassportView } from './types';

export interface InterpretationClaim {
  mode: 'OBSERVE' | 'EXPLAIN' | 'CHALLENGE' | 'COACH' | 'ACT';
  claim: string;
  evidence: string[];
  evidence_state: 'SUFFICIENT' | 'INSUFFICIENT EVIDENCE';
  truth_class?: string;
  note?: string;
}

export interface ActionProposal {
  proposal: string;
  owner: string;
  rationale: string;
  evidence: string[];
  review_point: string;
  approval_status: 'PROPOSAL — AWAITING HUMAN APPROVAL';
}

export interface Interpretation {
  claims: InterpretationClaim[];
  proposals: ActionProposal[];
  bridge: { signal: string; interpretation: string; evidence: string[]; capability_implication: string; next_action: string; owner: string; review: string }[];
}

/** Counts by truth class across a town's reality facts. */
function classCounts(town: TownPassportView): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const facts of Object.values(town.reality)) {
    for (const f of facts) counts[f.truth_class] = (counts[f.truth_class] ?? 0) + 1;
  }
  return counts;
}

export function interpretTown(town: TownPassportView): Interpretation {
  const claims: InterpretationClaim[] = [];
  const proposals: ActionProposal[] = [];
  const bridge: Interpretation['bridge'] = [];
  const counts = classCounts(town);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const verified = (counts['VERIFIED'] ?? 0) + (counts['ACTUAL'] ?? 0);
  const active = town.cells.filter((c) => c.stance !== 'OBSERVE');
  const openAgenda = town.agenda.summary.open ?? 0;

  // OBSERVE — what is present
  claims.push({
    mode: 'OBSERVE',
    claim: `${town.name} carries ${total} town-reality facts, of which ${verified} are VERIFIED/ACTUAL. Verification backlog: ${openAgenda} open items. Initiative stances: ${town.cells.filter((c) => c.stance === 'OBSERVE').length} OBSERVE, ${active.length} active.`,
    evidence: [town.passport_id, `version:${town.version}`],
    evidence_state: total > 0 ? 'SUFFICIENT' : 'INSUFFICIENT EVIDENCE',
    truth_class: 'VERIFIED',
    note: `Snapshot as_of ${town.as_of}`,
  });

  // EXPLAIN — what the evidence suggests
  const ftv = counts['FIELD_TO_VERIFY'] ?? 0;
  claims.push({
    mode: 'EXPLAIN',
    claim: ftv > 0
      ? `${ftv} facts rest on pre-review field-pack evidence (review_required=true) — the passport is directionally informative but not field-certified.`
      : `No field-pack-derived facts in this town; the passport's uncertainty is absence of evidence, not disputed evidence.`,
    evidence: [`facts:FIELD_TO_VERIFY=${ftv}`],
    evidence_state: ftv > 0 ? 'SUFFICIENT' : 'SUFFICIENT',
    truth_class: 'MODELLED',
  });

  // CHALLENGE — assumption/anomaly
  const gaps = town.trajectory.unknowns.filter((u) => u.statement.includes('PORTFOLIO GAP'));
  claims.push({
    mode: 'CHALLENGE',
    claim: gaps.length > 0
      ? `${gaps.length} pack opportunity domain(s) in ${town.name} have no owner in the canonical initiative portfolio — strategy cannot proceed on these until ruled.`
      : `Market denominators are entirely unsourced here; any sizing claim would be fabricated. Challenge: no target may be committed until denominators arrive.`,
    evidence: gaps.length > 0 ? gaps.map((g, i) => `unknown:gap-${i}`) : ['unknown:market-absent'],
    evidence_state: 'SUFFICIENT',
    truth_class: gaps.length > 0 ? 'FIELD_TO_VERIFY' : 'ABSENT',
    note: 'INSUFFICIENT EVIDENCE for any quantitative market claim',
  });

  // COACH — capability implication
  const capNote = town.capability.capacity_notes;
  claims.push({
    mode: 'COACH',
    claim: `Capability layer is unverified: ${capNote} The binding constraint in ${town.name} is verification capacity, not initiative capability.`,
    evidence: ['capability:RECORDS_NOT_ACCESSIBLE'],
    evidence_state: 'INSUFFICIENT EVIDENCE',
    truth_class: 'RECORDS_NOT_ACCESSIBLE',
  });

  // ACT — proposals only
  const day1 = town.workpacks.day1;
  for (const w of day1.slice(0, 2)) {
    proposals.push({
      proposal: `Execute Day-1 verification item ${w.id}: ${w.what}`,
      owner: w.owner,
      rationale: w.decision_unlocked,
      evidence: [`workpack:${w.id}`],
      review_point: `due ${w.due}`,
      approval_status: 'PROPOSAL — AWAITING HUMAN APPROVAL',
    });
  }
  if (proposals.length === 0) {
    proposals.push({
      proposal: `No Day-1 work is queued for ${town.name}; approve the Week-1 items instead.`,
      owner: 'Town Coordinator',
      rationale: 'Day-1 queue empty; backlog starts at Week 1.',
      evidence: [`workpacks:groups=${JSON.stringify(town.workpacks.groups)}`],
      review_point: 'next weekly review',
      approval_status: 'PROPOSAL — AWAITING HUMAN APPROVAL',
    });
  }

  // ACT — the mode is represented as an explicit proposal-only claim (then the proposals below)
  claims.push({
    mode: 'ACT',
    claim: proposals.length > 0
      ? `${proposals.length} action proposal(s) staged for ${town.name}. Nothing executes without human approval — ACT is proposal-only.`
      : `No action is proposed for ${town.name}; the correct ACT state is none.`,
    evidence: proposals.length > 0 ? proposals.flatMap((p) => p.evidence) : ['workpacks:groups=none'],
    evidence_state: proposals.length > 0 ? 'SUFFICIENT' : 'INSUFFICIENT EVIDENCE',
    truth_class: 'VERIFIED',
    note: 'Proposals carry owner, rationale, evidence, review point and approval status.',
  });

  // SIGNAL -> ... -> REVIEW bridge chain (one row per active cell or one general)
  const cellSource: CellView[] = active.length > 0 ? active : [town.cells[0]];
  for (const c of cellSource.slice(0, 3)) {
    bridge.push({
      signal: `Cell ${c.cell_id} stance=${c.stance}`,
      interpretation: c.basis.why ?? c.basis.rationale ?? 'no basis recorded',
      evidence: c.evidence_refs.length > 0 ? c.evidence_refs : ['none — INSUFFICIENT EVIDENCE'],
      capability_implication: `readiness=${c.readiness_verdict}; deployment=${c.deployment_decision}`,
      next_action: `verification workpacks for ${c.initiative_key} (see Verification Agenda)`,
      owner: 'Town Coordinator (verification) -> National Initiative Head (ruling)',
      review: 'after pack review + fit verification',
    });
  }

  return { claims, proposals, bridge };
}
