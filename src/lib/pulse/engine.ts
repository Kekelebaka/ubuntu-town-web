// src/lib/pulse/engine.ts — ONE derived/read Pulse engine.
// Hierarchy: National → Province → Blueprint Town → Initiative → Team/Person/Role →
// Mission/Work → Proof → Learning → Opportunity → Outcome (rows, not nodes).
// Views (OBSERVE/EXPLAIN/CHALLENGE/COACH/ACT) are PROJECTIONS of this one engine.
// The engine never writes: ACT yields a proposal that ALWAYS requires human approval.

import type { PulseDataset, PulseNode, ActionProposal, PulseStatement } from "./types";
import type { ScopeNode, RoleAssignment } from "./scope-resolver";
import { resolveViewerScopes, canSee } from "./scope-resolver";
import { nationalRollup, provinceRollup, townRollup, initiativeRollup, personProjection } from "./reducers";

export interface Viewer { userId: string; assignments: RoleAssignment[] }

/** Full hierarchy — every level a projection of the SAME rows. */
export function computeHierarchy(ds: PulseDataset, towns: { id: string; name: string; province: string }[], now: number): PulseNode {
  return nationalRollup(ds, towns, now);
}

/** Scope-guarded single view. Denied scopes return INSUFFICIENT EVIDENCE, never data. */
export function computeView(ds: PulseDataset, tree: ScopeNode[], viewer: Viewer, scopeId: string, now: number):
  | { status: "ok"; node: PulseNode; person?: undefined }
  | { status: "ok"; node?: undefined; person: ReturnType<typeof personProjection> }
  | { status: "denied"; reason: string } {
  const scopes = resolveViewerScopes(viewer, tree);
  if (scopeId.startsWith("person:")) {
    // Person/Role Pulse is reached THROUGH scopes: self, or an actor in a visible town.
    // (Person nodes are synthetic — scope-before-person rule decides, not tree membership.)
    const personId = scopeId.slice("person:".length);
    const activeInVisibleScope = personId === viewer.userId || [...ds.works, ...ds.signals].some(
      (r) => r.created_by === personId && canSee(scopes, `town:${r.town_id}`)
    );
    if (!activeInVisibleScope) {
      return { status: "denied", reason: `Person ${personId} is not active in any scope visible to this viewer (scope before person).` };
    }
    return { status: "ok", person: personProjection(ds, personId, now) };
  }
  if (!canSee(scopes, scopeId)) {
    return { status: "denied", reason: `Scope ${scopeId} is outside this viewer's assignments (fail-closed).` };
  }
  const nodeById = new Map(tree.map((n) => [n.id, n]));
  const node = nodeById.get(scopeId);
  if (!node) return { status: "denied", reason: `Unknown scope ${scopeId}.` };

  if (node.kind === "initiative") {
    return { status: "ok", node: initiativeRollup(ds, node.id.slice("initiative:".length), undefined, now) };
  }
  if (node.kind === "town") {
    return { status: "ok", node: townRollup(ds, { id: node.id.slice("town:".length), name: node.label }, now) };
  }
  if (node.kind === "province") {
    const province = node.label;
    const towns = tree.filter((n) => n.kind === "town" && n.parent === `province:${province}`)
      .map((n) => ({ id: n.id.slice("town:".length), name: n.label, province }));
    return { status: "ok", node: provinceRollup(ds, province, towns, now) };
  }
  const towns = tree.filter((n) => n.kind === "town")
    .map((n) => ({ id: n.id.slice("town:".length), name: n.label, province: n.parent!.slice("province:".length) }));
  return { status: "ok", node: nationalRollup(ds, towns, now) };
}

export type PulseMode = "OBSERVE" | "EXPLAIN" | "CHALLENGE" | "COACH" | "ACT";

/** Mode projection over one statement set — same truth, different reading. */
export function projectMode(mode: PulseMode, statements: PulseStatement[]): string[] {
  switch (mode) {
    case "OBSERVE":
      return statements.map((s) => s.interpretation);
    case "EXPLAIN":
      return statements.map((s) => `${s.interpretation} [evidence: ${s.evidence.join(", ") || "none"}]`);
    case "CHALLENGE":
      return statements.filter((s) => s.kind === "insufficient_evidence" || (s.nextAction !== null))
        .map((s) => `Challenge: ${s.reason ?? s.interpretation}`);
    case "COACH":
      return statements.filter((s) => s.nextAction !== null)
        .map((s) => `Coach: ${s.nextAction!.action} (owner: ${s.nextAction!.owner}, review: ${s.nextAction!.reviewPoint})`);
    case "ACT":
      return statements.filter((s) => s.nextAction !== null)
        .map((s) => `PROPOSE ONLY — ${s.nextAction!.action} → requires human approval`);
  }
}

/** ACT-mode: propose a consequential action. Consequential actions ALWAYS require human
 *  approval, and a viewer can never propose against a scope they cannot see. */
export function proposeAction(viewer: Viewer, tree: ScopeNode[], targetScope: string, action: string, now: number): ActionProposal {
  const scopes = resolveViewerScopes(viewer, tree);
  const base: ActionProposal = {
    status: "proposed", requiresHumanApproval: true, action,
    targetScope, owner: "human approver (scope owner)", reviewPoint: "human approval gate",
  };
  if (!canSee(scopes, targetScope)) {
    return { ...base, status: "denied", reason: "Target scope outside viewer assignments — denied (fail-closed)." };
  }
  return base;
}
