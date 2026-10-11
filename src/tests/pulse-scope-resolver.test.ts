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

  it("nested + initiative scope: initiative nodes hang under towns; initiative_head scoped to initiative", () => {
    const tree = buildScopeTree(towns, [
      { id: "i-food", name: "Food Garden", town_id: "t1" },
      { id: "i-national", name: "Ubuntu Passport", town_id: null },
    ]);
    expect(tree.find((n) => n.id === "initiative:i-food")!.parent).toBe("town:t1");
    expect(tree.find((n) => n.id === "initiative:i-national")!.parent).toBe("national");
    const head = resolveViewerScopes(
      { userId: "u-i", assignments: [{ user_id: "u-i", role_key: "initiative_head", town_id: null, initiative: "i-food" }] },
      tree
    );
    expect(canSee(head, "initiative:i-food")).toBe(true);
    expect(canSee(head, "town:t2")).toBe(false);
  });

  it("same role / same scope grants identical visibility (excluding the self-node)", () => {
    const tree = buildScopeTree(towns);
    const a = resolveViewerScopes({ userId: "u-1", assignments: [{ user_id: "u-1", role_key: "coordinator", town_id: "t1" }] }, tree);
    const b = resolveViewerScopes({ userId: "u-2", assignments: [{ user_id: "u-2", role_key: "coordinator", town_id: "t1" }] }, tree);
    const strip = (s: string[]) => s.filter((id) => !id.startsWith("person:")).sort();
    expect(strip(a)).toEqual(strip(b));
    expect(a).toContain("person:u-1"); // self-node is per-viewer
  });
});
