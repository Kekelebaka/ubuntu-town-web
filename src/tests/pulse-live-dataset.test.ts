// src/tests/pulse-live-dataset.test.ts — live adapter: mapping fidelity, read-only contract,
// default-deny route protection for /pulse.

import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";
import {
  mapWorkRow, mapSignalRow, mapProofRow, mapMemoryRow, mapOpportunityRow,
} from "../lib/pulse/live-dataset";
import { requiresAuth } from "../lib/route-guard";
import { computeView, projectMode, proposeAction } from "../lib/pulse/engine";
import { buildScopeTree, resolveViewerScopes } from "../lib/pulse/scope-resolver";
import { initiativeRollup, personProjection } from "../lib/pulse/reducers";
import type { WorkRow } from "../lib/pulse/types";

describe("live-dataset adapter — mapping fidelity (no invented data)", () => {
  it("maps a community_work row exactly; missing updated_at falls back to created_at", () => {
    const w = mapWorkRow({
      id: "cw-1", town_id: "t1", initiative: "Food Garden", created_by: "u-1",
      created_at: "2026-09-01T00:00:00Z", updated_at: null, status: "published",
    });
    expect(w).toEqual({
      id: "cw-1", town_id: "t1", initiative: "Food Garden", created_by: "u-1",
      created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z", status: "published",
    });
  });

  it("signals carry no initiative column → initiative stays null (never inferred)", () => {
    const s = mapSignalRow({ id: "sg-1", town_id: "t1", created_by: "u-1", created_at: "2026-09-01T00:00:00Z", status: "open" });
    expect(s.initiative).toBeNull();
  });

  it("proofs inherit town/initiative from their canonical work row", () => {
    const works: WorkRow[] = [mapWorkRow({
      id: "cw-1", town_id: "t1", initiative: "Food Garden", created_by: "u-1",
      created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z", status: "published",
    })];
    const byId = new Map(works.map((w) => [w.id, w]));
    const p = mapProofRow({ id: "pf-1", community_work_id: "cw-1", status: "verified", created_at: "2026-09-02T00:00:00Z" }, byId);
    expect(p.town_id).toBe("t1");
    expect(p.initiative).toBe("Food Garden");
    const orphan = mapProofRow({ id: "pf-2", community_work_id: null, status: "captured", created_at: "2026-09-02T00:00:00Z" }, byId);
    expect(orphan.town_id).toBe(""); // unknown — not invented
  });

  it("memories map to learnings; proof-sourced memories keep the proof reference", () => {
    const l = mapMemoryRow({ id: "m-1", town_id: "t1", subject_type: "proof", subject_id: "pf-1", summary: "Raised beds work.", created_at: "2026-09-03T00:00:00Z" });
    expect(l.source_proof_id).toBe("pf-1");
    expect(l.text).toBe("Raised beds work.");
  });

  it("opportunity_points map without an initiative claim (column does not exist)", () => {
    const o = mapOpportunityRow({ id: "op-1", town_id: "t1", status: "open", created_at: "2026-09-04T00:00:00Z" });
    expect(o.initiative).toBeNull();
  });
});

describe("live-dataset adapter — READ-ONLY contract (second-source-of-truth guard)", () => {
  it("contains no Supabase mutation calls anywhere in the file", () => {
    const src = readFileSync(join(__dirname, "../lib/pulse/live-dataset.ts"), "utf8");
    for (const forbidden of [".insert(", ".upsert(", ".update(", ".delete(", ".remove(", ".rpc("]) {
      expect(src.includes(forbidden)).toBe(false);
    }
    expect(src.includes(".select(")).toBe(true); // it does read
  });
});

describe("/pulse route — default-deny protection", () => {
  it("is protected by the route guard (not public)", () => {
    expect(requiresAuth("/pulse")).toBe(true);
    expect(requiresAuth("/pulse?scope=initiative:i-food")).toBe(true);
  });
});

describe("live rows feed the ONE engine (integration shape)", () => {
  it("mapped live rows flow through the same reducers + scope guard as fixtures", () => {
    const w = mapWorkRow({
      id: "cw-1", town_id: "t1", initiative: "Food Garden", created_by: "u-1",
      created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z", status: "published",
    });
    const ds = {
      works: [w], signals: [], proofs: [], learnings: [], opportunities: [], memories: [],
    };
    const init = initiativeRollup(ds, "Food Garden", "t1", Date.parse("2026-10-11T00:00:00Z"));
    expect(init.metrics.workPublished).toBe(1);
    expect(init.metrics.proofCaptureRate).toBe(0); // published work without proof → real signal
    const tree = buildScopeTree([{ id: "t1", name: "Senekal", province: "Free State", is_founding: true }]);
    const viewer = { userId: "u-1", assignments: [{ user_id: "u-1", role_key: "coordinator", town_id: "t1" }] };
    expect(computeView(ds, tree, viewer, "town:t1", Date.parse("2026-01-01T00:00:00Z")).status).toBe("ok");
    expect(computeView(ds, tree, viewer, "town:t2", Date.parse("2026-01-01T00:00:00Z")).status).toBe("denied");
    const proj = personProjection(ds, "u-1", Date.parse("2026-01-01T00:00:00Z"));
    expect(proj.evidence.workIds).toEqual(["cw-1"]);
    const scopes = resolveViewerScopes(viewer, tree);
    expect(scopes).toContain("town:t1");
    expect(projectMode("ACT", init.statements).every((s) => s.includes("requires human approval"))).toBe(true);
    expect(proposeAction(viewer, tree, "town:t1", "Capture proof for cw-1", Date.now()).requiresHumanApproval).toBe(true);
  });
});
