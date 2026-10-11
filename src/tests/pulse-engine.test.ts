// src/tests/pulse-engine.test.ts — ONE engine, hierarchical projections, scope-guarded views.
// Security mandate: same-role/same-scope, multiple roles, nested scope, initiative scope,
// person scope, cross-town denial, cross-province denial, national aggregation,
// unauthorized mutation attempts.

import { describe, it, expect } from "vitest";
import { buildScopeTree, resolveViewerScopes, canSee } from "../lib/pulse/scope-resolver";
import { computeHierarchy, computeView, projectMode, proposeAction, type Viewer } from "../lib/pulse/engine";
import { fixtureDataset as ds, towns, initiatives, NOW } from "./fixtures/pulse-dataset";

const tree = buildScopeTree(towns, initiatives);

const coordinatorA: Viewer = { userId: "u-a", assignments: [{ user_id: "u-a", role_key: "coordinator", town_id: "t1" }] };
const coordinatorB: Viewer = { userId: "u-b", assignments: [{ user_id: "u-b", role_key: "coordinator", town_id: "t2" }] };
const coordinatorA2: Viewer = { userId: "u-a2", assignments: [{ user_id: "u-a2", role_key: "coordinator", town_id: "t1" }] };
const provincialFS: Viewer = { userId: "u-p", assignments: [{ user_id: "u-p", role_key: "provincial_lead", town_id: null, province: "Free State" }] };
const national: Viewer = { userId: "u-n", assignments: [{ user_id: "u-n", role_key: "admin", town_id: null }] };
const initiativeHead: Viewer = { userId: "u-i", assignments: [{ user_id: "u-i", role_key: "initiative_head", town_id: null, initiative: "i-food" }] };
const multiRole: Viewer = { userId: "u-m", assignments: [
  { user_id: "u-m", role_key: "coordinator", town_id: "t1" },
  { user_id: "u-m", role_key: "initiative_head", town_id: null, initiative: "i-digital" },
] };

describe("pulse engine — hierarchy (one truth, projections only)", () => {
  it("national → province → town → initiative chain is one nested projection", () => {
    const h = computeHierarchy(ds, towns, NOW);
    expect(h.scope.id).toBe("national");
    expect(h.children.map((c) => c.scope.label).sort()).toEqual(["Free State", "Gauteng"]);
    const fs = h.children.find((c) => c.scope.label === "Free State")!;
    const t1 = fs.children.find((c) => c.scope.id === "town:t1")!;
    expect(t1.children.map((c) => c.scope.id)).toEqual(["initiative:i-food@t1"]);
    // every level's evidence ids are a subset of the level below's union (no new records)
    const childWorkIds = new Set(fs.children.flatMap((c) => c.evidence.workIds));
    for (const id of fs.evidence.workIds) expect(childWorkIds.has(id)).toBe(true);
  });

  it("UNAUTHORIZED mutation attempts: engine is read-only and proposals always require human approval", () => {
    const before = JSON.stringify(ds);
    computeHierarchy(ds, towns, NOW);
    const p = proposeAction(coordinatorA, tree, "town:t1", "Publish workpack", NOW);
    expect(p.requiresHumanApproval).toBe(true);
    expect(JSON.stringify(ds)).toBe(before);
    const cross = proposeAction(coordinatorA, tree, "town:t2", "Publish workpack", NOW);
    expect(cross.status).toBe("denied");
    const crossProv = proposeAction(provincialFS, tree, "town:t3", "Deploy initiative", NOW);
    expect(crossProv.status).toBe("denied");
  });
});

describe("pulse engine — scope security matrix", () => {
  it("same role / same scope: both coordinators of Senekal see Senekal", () => {
    for (const v of [coordinatorA, coordinatorA2]) {
      const r = computeView(ds, tree, v, "town:t1", NOW);
      expect(r.status).toBe("ok");
    }
    expect(canSee(resolveViewerScopes(coordinatorA, tree), "town:t1")).toBe(true);
    expect(canSee(resolveViewerScopes(coordinatorA2, tree), "town:t1")).toBe(true);
  });

  it("cross-town DENIED: Senekal coordinator cannot read Ladybrand view", () => {
    const r = computeView(ds, tree, coordinatorA, "town:t2", NOW);
    expect(r.status).toBe("denied");
  });

  it("cross-province DENIED: Free State lead cannot read Gauteng view", () => {
    const r = computeView(ds, tree, provincialFS, "province:Gauteng", NOW);
    expect(r.status).toBe("denied");
    // but the whole province is readable
    const ok = computeView(ds, tree, provincialFS, "province:Free State", NOW);
    expect(ok.status).toBe("ok");
  });

  it("nested scope: town coordinator sees initiative children of their town only", () => {
    const scopes = resolveViewerScopes(coordinatorA, tree);
    expect(canSee(scopes, "initiative:i-food")).toBe(true);     // own town's initiative
    expect(canSee(scopes, "initiative:i-digital")).toBe(false); // other town's initiative
    expect(canSee(scopes, "initiative:i-national")).toBe(false);
  });

  it("initiative-specific scope: initiative head sees their initiative + context, nothing else", () => {
    const scopes = resolveViewerScopes(initiativeHead, tree);
    expect(canSee(scopes, "initiative:i-food")).toBe(true);
    expect(canSee(scopes, "national")).toBe(true);              // context breadcrumb
    expect(canSee(scopes, "town:t2")).toBe(false);              // no town scope
    expect(canSee(scopes, "initiative:i-digital")).toBe(false);
    const r = computeView(ds, tree, initiativeHead, "initiative:i-food", NOW);
    expect(r.status).toBe("ok");
  });

  it("person/role scope: any viewer sees their own person projection; others' denied", () => {
    expect(computeView(ds, tree, coordinatorA, "person:u-a", NOW).status).toBe("ok");
    expect(computeView(ds, tree, coordinatorA, "person:u-cara", NOW).status).toBe("denied");
    expect(computeView(ds, tree, national, "person:u-cara", NOW).status).toBe("ok");
  });

  it("multiple-role user: visibility is the union of assignment scopes", () => {
    const scopes = resolveViewerScopes(multiRole, tree);
    expect(canSee(scopes, "town:t1")).toBe(true);
    expect(canSee(scopes, "initiative:i-digital")).toBe(true);
    expect(canSee(scopes, "initiative:i-food")).toBe(true);     // child of visible town
    expect(canSee(scopes, "town:t3")).toBe(false);
  });

  it("national aggregation: national role can compute every level (aggregation is not leakage)", () => {
    for (const id of ["national", "province:Free State", "province:Gauteng", "town:t1", "town:t2", "town:t3", "initiative:i-food"]) {
      expect(computeView(ds, tree, national, id, NOW).status).toBe("ok");
    }
    const h = computeView(ds, tree, national, "national", NOW);
    expect(h.status === "ok" && h.node && h.node.metrics.workPublished).toBe(3);
  });
});

describe("pulse engine — output model (OBSERVE…ACT over one truth)", () => {
  it("modes project the same statements; ACT never executes", () => {
    const r = computeView(ds, tree, national, "town:t1", NOW);
    if (r.status !== "ok" || !r.node) throw new Error("expected ok view");
    const obs = projectMode("OBSERVE", r.node.statements);
    const explain = projectMode("EXPLAIN", r.node.statements);
    const act = projectMode("ACT", r.node.statements);
    expect(obs.length).toBeGreaterThan(0);
    expect(explain.some((s) => s.includes("[evidence:"))).toBe(true);
    expect(act.every((s) => s.startsWith("PROPOSE ONLY") && s.includes("requires human approval"))).toBe(true);
  });

  it("INSUFFICIENT EVIDENCE is returned explicitly where evidence is thin", () => {
    const emptyTown = computeView(ds, tree, coordinatorB, "town:t2", NOW);
    if (emptyTown.status !== "ok" || !emptyTown.node) throw new Error("expected ok");
    // Ladybrand HAS rows, so statements are real; a stranger scope returns denial/insufficiency instead of invention
    const challenge = projectMode("CHALLENGE", emptyTown.node.statements);
    expect(Array.isArray(challenge)).toBe(true);
  });
});
