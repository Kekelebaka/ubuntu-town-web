// src/lib/pulse/scope-resolver.ts — Ubuntu Town OS shared primitive
// ONE scope model for ALL Pulse views (National/Province/Town/Initiative/Person).
// Pure functions over existing canonical rows (towns + initiatives + role_assignments) —
// derived only, no persistence, no second source of truth. Role is an assignment + scope,
// never a person's permanent identity.

export type ScopeKind = "national" | "province" | "town" | "initiative" | "person";

export interface ScopeNode {
  kind: ScopeKind;
  id: string;          // stable id: "national", "province:<name>", "town:<uuid>", "initiative:<id>", "person:<id>"
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

export interface InitiativeRow {
  id: string;
  name: string;
  town_id?: string | null; // null = national-level initiative (parent = national)
}

export interface RoleAssignment {
  user_id: string;
  role_key: string;    // e.g. coordinator | deputy | admin | ops | provincial_lead | initiative_head | ...
  town_id?: string | null;
  province?: string | null;
  initiative?: string | null; // initiative-scoped assignment
}

const NATIONAL_ROLES = new Set(["admin", "ops", "national_lead"]);
const PROVINCIAL_ROLES = new Set(["provincial_lead", "functional_head"]);
const INITIATIVE_ROLES = new Set(["initiative_head"]);

export function buildScopeTree(towns: TownRow[], initiatives: InitiativeRow[] = []): ScopeNode[] {
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
  provinces.forEach((p) => nodes.push(p));
  for (const i of initiatives) {
    nodes.push({
      kind: "initiative",
      id: `initiative:${i.id}`,
      label: i.name,
      parent: i.town_id ? `town:${i.town_id}` : "national",
    });
  }
  return nodes;
}

function ancestorIds(id: string | null, byId: Map<string, ScopeNode>): string[] {
  const out: string[] = [];
  let cur = id;
  while (cur) {
    out.push(cur);
    cur = byId.get(cur)?.parent ?? null;
  }
  return out;
}

/** Which scope nodes this viewer may see. Scope BEFORE person.
 *  Visibility = assigned nodes + ancestor chain (context) + descendants (drill-down).
 *  Fail-closed: an unassigned viewer sees only their own person node. */
export function resolveViewerScopes(viewer: { userId: string; assignments: RoleAssignment[] }, tree: ScopeNode[]): string[] {
  const byId = new Map(tree.map((n) => [n.id, n]));
  const assigned = new Set<string>([`person:${viewer.userId}`]);

  for (const a of viewer.assignments) {
    if (NATIONAL_ROLES.has(a.role_key)) {
      for (const n of tree) assigned.add(n.id);
    } else if (PROVINCIAL_ROLES.has(a.role_key) && a.province) {
      assigned.add(`province:${a.province}`);
    } else if (INITIATIVE_ROLES.has(a.role_key) && a.initiative) {
      assigned.add(`initiative:${a.initiative}`);
    } else if (a.town_id) {
      assigned.add(`town:${a.town_id}`);
    }
    assigned.add(`person:${viewer.userId}`);
  }

  const visible = new Set<string>(assigned);
  Array.from(assigned).forEach((id) => {
    for (const anc of ancestorIds(byId.get(id)?.parent ?? null, byId)) visible.add(anc);
    for (const n of tree) {
      if (ancestorIds(n.parent, byId).includes(id)) visible.add(n.id);
    }
  });
  return Array.from(visible);
}

export function canSee(viewerScopes: string[], scopeId: string): boolean {
  return viewerScopes.includes(scopeId);
}
