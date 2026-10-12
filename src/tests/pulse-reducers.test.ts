// src/tests/pulse-reducers.test.ts — bottom-up rollups: initiative → town → province → national
// + person/role projection. Invariants: one truth, no duplication, evidence-linked claims,
// INSUFFICIENT EVIDENCE where evidence does not exist.

import { describe, it, expect } from "vitest";
import {
  initiativeRollup, townRollup, provinceRollup, nationalRollup, personProjection,
} from "../lib/pulse/reducers";
import { fixtureDataset, towns, NOW } from "./fixtures/pulse-dataset";

const ds = fixtureDataset;

describe("pulse reducers (one truth, many projections)", () => {
  it("initiative level: metrics derive from exactly the cell's rows", () => {
    const n = initiativeRollup(ds, "i-food", "t1", NOW);
    expect(n.metrics.workPublished).toBe(2);
    expect(n.metrics.workOpen).toBe(2);          // w-3 fresh + w-4 stale
    expect(n.metrics.staleOpenWork).toBe(1);     // w-4
    expect(n.metrics.proofsCaptured).toBe(2);
    expect(n.metrics.proofCaptureRate).toBe(1);  // 2 proofs / 2 published
    expect(n.metrics.peopleActive).toBe(2);      // alice + bob
  });

  it("every evidence id references a real fixture row (no invented data)", () => {
    const n = initiativeRollup(ds, "i-food", "t1", NOW);
    const known = new Set([
      ...ds.works.map((w) => w.id), ...ds.proofs.map((p) => p.id), ...ds.signals.map((s) => s.id),
      ...ds.learnings.map((l) => l.id), ...ds.opportunities.map((o) => o.id),
    ]);
    for (const st of n.statements) {
      for (const id of st.evidence) expect(known.has(id)).toBe(true);
    }
  });

  it("INSUFFICIENT EVIDENCE where proof capture cannot be computed (no published work)", () => {
    // Ladybrand w-6 is open; w-5 published but has no proof — rate computable (0/1 = 0).
    const lady = initiativeRollup(ds, "i-digital", "t2", NOW);
    expect(lady.metrics.proofCaptureRate).toBe(0);
    const gap = lady.statements.find((s) => s.interpretation.includes("Proof capture rate"));
    expect(gap!.capabilityImplication).toContain("lags");
    // empty initiative -> insufficient
    const empty = initiativeRollup(ds, "i-does-not-exist", "t1", NOW);
    expect(empty.statements[0].kind).toBe("insufficient_evidence");
    expect(empty.statements[0].reason).toContain("INSUFFICIENT EVIDENCE");
  });

  it("town rollup equals the sum of its initiative projections of the SAME rows (no duplication)", () => {
    const town = townRollup(ds, { id: "t1", name: "Senekal" }, NOW);
    const init = initiativeRollup(ds, "i-food", "t1", NOW);
    expect(town.metrics.workPublished).toBe(init.metrics.workPublished);
    expect(town.metrics.workOpen).toBe(init.metrics.workOpen);
    expect(town.metrics.proofsCaptured).toBe(init.metrics.proofsCaptured);
    expect(town.children.map((c) => c.scope.id)).toEqual(["initiative:i-food@t1"]);
  });

  it("provincial rollup aggregates its towns; silent/stalled towns surface as capacity gap", () => {
    const prov = provinceRollup(ds, "Free State", towns, NOW);
    expect(prov.children.map((c) => c.scope.id).sort()).toEqual(["town:t1", "town:t2"]);
    expect(prov.metrics.workPublished).toBe(3);  // w-1,w-2 + w-5
    expect(prov.metrics.proofsCaptured).toBe(2);
    const gauteng = provinceRollup(ds, "Gauteng", towns, NOW);
    expect(gauteng.metrics.staleOpenWork).toBe(1); // w-7
  });

  it("national rollup aggregates provinces — same rows one level up", () => {
    const nat = nationalRollup(ds, towns, NOW);
    expect(nat.children.map((c) => c.scope.label).sort()).toEqual(["Free State", "Gauteng"]);
    expect(nat.metrics.workPublished).toBe(3);
    expect(nat.metrics.workOpen).toBe(4);       // w-3,w-4,w-6,w-7
    expect(nat.metrics.staleOpenWork).toBe(2);  // w-4, w-7
    expect(nat.metrics.peopleActive).toBe(4);   // alice,bob,cara,dan
  });

  it("person projection: WHO IS MOVING / WHO NEEDS HELP — evidence before title", () => {
    const alice = personProjection(ds, "u-alice", NOW);
    expect(alice.moving).toBe(true);
    expect(alice.needsHelp).toBe(false);
    expect(alice.evidence.workIds.sort()).toEqual(["w-1", "w-2"]);
    const bob = personProjection(ds, "u-bob", NOW);
    expect(bob.needsHelp).toBe(true);            // w-4 stale
    const nobody = personProjection(ds, "u-nobody", NOW);
    expect(nobody.statements[0].kind).toBe("insufficient_evidence");
  });

  it("reducers never mutate the dataset (derived/read-only contract)", () => {
    const before = JSON.stringify(ds);
    initiativeRollup(ds, "i-food", "t1", NOW);
    townRollup(ds, { id: "t1", name: "Senekal" }, NOW);
    provinceRollup(ds, "Free State", towns, NOW);
    nationalRollup(ds, towns, NOW);
    personProjection(ds, "u-alice", NOW);
    expect(JSON.stringify(ds)).toBe(before);
  });
});
