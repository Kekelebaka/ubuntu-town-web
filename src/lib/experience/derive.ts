// src/lib/experience/derive.ts — EXPERIENCE 001 derived layer.
// Adapts the SYNTHETIC universe (universe.ts) into the EXISTING Pulse engine's dataset
// shape and computes through the real engine (computeHierarchy / computeView / projectMode /
// proposeAction). One derived intelligence engine — synthetic input for Experience 001.
// ⚠ SYNTHETIC DEMO DATA.

import type { PulseDataset, PulseStatement, ActionProposal } from '@/lib/pulse/types';
import type { PulseMode } from '@/lib/pulse/engine';
import { computeHierarchy, computeView, projectMode, proposeAction } from '@/lib/pulse/engine';
import { buildScopeTree, type InitiativeRow, type RoleAssignment, type TownRow } from '@/lib/pulse/scope-resolver';
import { SIGNALS, WORK, PROOFS, LEARNINGS, OPPORTUNITIES, TOWNS, INITIATIVES, PEOPLE } from './universe';

export const DEMO_VIEWER = {
  userId: 'demo-operator',
  assignments: [{ user_id: 'demo-operator', role_key: 'national_lead' } as RoleAssignment],
};

export function universeToDataset(): PulseDataset {
  return {
    signals: SIGNALS.map((r) => ({ id: r.id, town_id: r.town, initiative: null, created_by: r.created_by, created_at: r.created_at, status: r.status })),
    works: WORK.map((r) => ({ id: r.id, town_id: r.town, initiative: r.initiative, created_by: r.owner, created_at: r.created_at, updated_at: r.updated_at, status: r.status })),
    proofs: PROOFS.map((r) => ({ id: r.id, town_id: r.town, initiative: null, work_id: r.work_id, created_at: r.created_at, state: r.state })),
    learnings: LEARNINGS.map((r) => ({ id: r.id, town_id: r.town, initiative: null, source_proof_id: r.source_proof_id, created_at: r.created_at, text: r.text })),
    opportunities: OPPORTUNITIES.map((r) => ({ id: r.id, town_id: r.town, initiative: null, status: r.status, created_at: r.created_at })),
    memories: [],
  };
}

export function universeTowns(): TownRow[] {
  return TOWNS.map((t) => ({ id: t.slug, name: t.name, province: t.province, is_founding: true }));
}

export function universeInitiatives(): InitiativeRow[] {
  return INITIATIVES.map((i) => ({ id: i.id, name: `${i.name} — ${townName(i.town)}`, town_id: i.town }));
}

function townName(slug: string) { return TOWNS.find((t) => t.slug === slug)?.name ?? slug; }

/** The ONE hierarchy: National → Province → Town → Initiative (engine-computed, evidence-subset). */
export function nationalRollup() {
  return computeHierarchy(universeToDataset(), universeTowns(), Date.now());
}

export function scopeTree() {
  return buildScopeTree(universeTowns(), universeInitiatives());
}

/** Scope-guarded view through the real engine (fail-closed). */
export function viewOf(scopeId: string) {
  return computeView(universeToDataset(), scopeTree(), DEMO_VIEWER, scopeId, Date.now());
}

export function actionProposal(targetScope: string, action: string): ActionProposal {
  return proposeAction(DEMO_VIEWER, scopeTree(), targetScope, action, Date.now());
}

/** Five-mode projection over a statement set (the real engine's projectMode). */
export function fiveModes(statements: PulseStatement[]): Record<PulseMode, string[]> {
  return {
    OBSERVE: projectMode('OBSERVE', statements),
    EXPLAIN: projectMode('EXPLAIN', statements),
    CHALLENGE: projectMode('CHALLENGE', statements),
    COACH: projectMode('COACH', statements),
    ACT: projectMode('ACT', statements),
  };
}

/** ACT contract rows — owner / rationale / evidence / review point / approval state. */
export function actRows(statements: PulseStatement[]) {
  return statements.filter((st) => st.nextAction !== null).map((st) => ({
    action: st.nextAction!.action,
    owner: st.nextAction!.owner,
    rationale: st.capabilityImplication ?? st.interpretation,
    evidence: st.evidence,
    reviewPoint: st.nextAction!.reviewPoint,
    approvalStatus: 'PROPOSED — PENDING HUMAN APPROVAL',
  }));
}

export function peopleOf(townSlug: string) { return PEOPLE.filter((p) => p.town === townSlug); }
