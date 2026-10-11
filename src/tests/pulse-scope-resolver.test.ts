// src/tests/pulse-scope-resolver.test.ts
import { describe, it, expect } from "vitest";
import {
  buildScopeTree,
  resolveViewerScopes,
  canSee,
  type TownRow,
  type RoleAssignment,
} from "../lib/pulse/scope-resolver";

const towns: TownRow[] = [
  { id: "t1", name: "Senekal", province: "Free State", is_founding: true },
  { id: "t2", name: "Ladybrand", province: "Free State", is_founding: true },
  { id: "t3", name: "Soweto", province: "Gauteng", is_founding: false },
];

describe("pulse scope resolver (shared primitive)", () => {
  it("builds NATIONAL -> PROVINCE -> TOWN once, no duplicate truth", () => {
    const tree = buildScopeTree(towns);
    expect(tree.filter((n) => n.kind === "national")).toHaveLength(1);
    expect(tree.filter((n) => n.kind === "province").map((n) => n.label).sort()).toEqual(["Free State", "Gauteng"]);
    expect(tree.filter((n) => n.kind === "town")).toHaveLength(3);
    expect(tree.find((n) => n.id === "town:t1")!.parent).toBe("province:Free State");
  });

  it("carries the Blueprint designation without changing navigation shape", () => {
    const tree = buildScopeTree(towns);
    expect(tree.find((n) => n.id === "town:t1")!.blueprintDesignation).toBe(true);
    expect(tree.find((n) => n.id === "town:t3")!.blueprintDesignation).toBe(false);
  });

  it("coordinator sees own town + province node, not other towns", () => {
    const tree = buildScopeTree(towns);
    const a: RoleAssignment[] = [{ user_id: "u-a", role_key: "coordinator", town_id: "t1" }];
    const scopes = resolveViewerScopes({ userId: "u-a", assignments: a }, tree);
    expect(canSee(scopes, "town:t1")).toBe(true);
    expect(canSee(scopes, "province:Free State")).toBe(true);
    expect(canSee(scopes, "town:t2")).toBe(false);   // Ladybrand DENIED
    expect(canSee(scopes, "town:t3")).toBe(false);
  });

  it("provincial lead sees the whole province, not other provinces", () => {
    const tree = buildScopeTree(towns);
    const p: RoleAssignment[] = [{ user_id: "u-p", role_key: "provincial_lead", town_id: null, province: "Free State" }];
    const scopes = resolveViewerScopes({ userId: "u-p", assignments: p }, tree);
    expect(canSee(scopes, "town:t1")).toBe(true);
    expect(canSee(scopes, "town:t2")).toBe(true);
    expect(canSee(scopes, "town:t3")).toBe(false); // Gauteng denied
    expect(canSee(scopes, "national")).toBe(true);
  });

  it("national role sees everything; role is assignment+scope, not identity", () => {
    const tree = buildScopeTree(towns);
    const n: RoleAssignment[] = [{ user_id: "u-n", role_key: "admin", town_id: null }];
    const scopes = resolveViewerScopes({ userId: "u-n", assignments: n }, tree);
    for (const id of ["national", "town:t1", "town:t2", "town:t3", "province:Gauteng"]) {
      expect(canSee(scopes, id)).toBe(true);
    }
  });

  it("same person can hold several assignments; visibility is the union of scopes", () => {
    const tree = buildScopeTree(towns);
    const multi: RoleAssignment[] = [
      { user_id: "u-m", role_key: "coordinator", town_id: "t1" },
      { user_id: "u-m", role_key: "coordinator", town_id: "t3" },
    ];
    const scopes = resolveViewerScopes({ userId: "u-m", assignments: multi }, tree);
    expect(canSee(scopes, "town:t1")).toBe(true);
    expect(canSee(scopes, "town:t3")).toBe(true);
    expect(canSee(scopes, "town:t2")).toBe(false);
  });

  it("unassigned viewer sees only self (fail-closed visibility)", () => {
    const tree = buildScopeTree(towns);
    const scopes = resolveViewerScopes({ userId: "u-x", assignments: [] }, tree);
    expect(canSee(scopes, "person:u-x")).toBe(true);
    expect(canSee(scopes, "town:t1")).toBe(false);
  });
});
