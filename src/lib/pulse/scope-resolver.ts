// src/lib/pulse/scope-resolver.ts — Ubuntu Town OS shared primitive
// ONE scope model for ALL Pulse views (National/Province/Town/Initiative/Person).
// Pure functions over existing canonical rows (towns + role_assignments) — derived
// only, no persistence, no second source of truth. Role is an assignment + scope,
// never a person's permanent identity.

export type ScopeKind = "national" | "province" | "town" | "initiative" | "person";

export interface ScopeNode {
  kind: ScopeKind;
  id: string;          // stable id: "national", "province:<name>", "town:<uuid>", ...
  label: string;
  parent: string | null;
  blueprintDesignation?: boolean; // display as Blueprint town (navigation = 50/9)
}

export interface TownRow {
  id: string;
  name: string;
  province: string;
  is_founding?: boolean;
}

export interface RoleAssignment {
  user_id: string;
  role_key: string;    // e.g. coordinator | deputy | admin | ops | provincial_lead | ...
  town_id: string | null;
  province?: string | null;
}

const NATIONAL_ROLES = new Set(["admin", "ops", "national_lead", "initiative_head"]);
const PROVINCIAL_ROLES = new Set(["provincial_lead", "functional_head"]);

export function buildScopeTree(towns: TownRow[]): ScopeNode[] {
  const nodes: ScopeNode[] = [{ kind: "national", id: "national", label: "South Africa", parent: null }];
  const provinces = new Map<string, ScopeNode>();
  for (const t of towns) {
    const pid = `province:${t.province}`;
    if (!provinces.has(t.province)) {
      provinces.set(t.province, {
        kind: "province", id: pid, label: t.province, parent: "national",
      });
    }
    nodes.push({
      kind: "town",
      id: `town:${t.id}`,
      label: t.name,
      parent: pid,
      blueprintDesignation: t.is_founding === true,
    });
  }
  return [...nodes, ...provinces.values()];
}

/** Which scope nodes this viewer may see. Scope BEFORE person. */
export function resolveViewerScopes(viewer: { userId: string; assignments: RoleAssignment[] }, tree: ScopeNode[]): string[] {
  const visible = new Set<string>();
  const byId = new Map(tree.map((n) => [n.id, n]));
  for (const a of viewer.assignments) {
    if (NATIONAL_ROLES.has(a.role_key)) {
      for (const n of tree) visible.add(n.id);
    } else if (PROVINCIAL_ROLES.has(a.role_key) && a.province) {
      visible.add("national");
      visible.add(`province:${a.province}`);
      for (const n of tree) {
        if (n.kind === "town" && n.parent === `province:${a.province}`) visible.add(n.id);
      }
    } else if (a.town_id) {
      const tid = `town:${a.town_id}`;
      const town = byId.get(tid);
      visible.add(tid);
      if (town?.parent) visible.add(town.parent);
    }
    visible.add(`person:${viewer.userId}`);
  }
  if (viewer.assignments.length === 0) visible.add(`person:${viewer.userId}`);
  return [...visible];
}

export function canSee(viewerScopes: string[], scopeId: string): boolean {
  return viewerScopes.includes(scopeId);
}
