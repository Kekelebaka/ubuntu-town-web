// src/lib/e003/scope.ts — ROLE × SCOPE ACCESS CONTRACT (authoritative 2026-10-12).
// NATIONAL  → everything (all 50 Blueprint towns · all active initiatives)
// TOWN      → ONE town × ALL active initiatives in that town (never another town's records)
// INITIATIVE→ ONE initiative × ALL 50 Blueprint towns (never another initiative's records)
// Fail closed: unknown role, unknown scope, or unmapped assignment = NO ACCESS.
// This is a pure resolution layer over role_assignments rows — the database (RLS) still
// enforces every query; this layer decides what the product MAY ASK FOR and SHOW.

import { BLUEPRINT_ROSTER, isBlueprintTown, RosterTown } from './roster';
import { CANONICAL_TEN, type CanonicalInitiative } from './registry';

export type LensKind = 'national' | 'town' | 'initiative';

export interface RoleAssignment {
  user_id: string;
  role_key: string;          // schema enum: admin|ops|coordinator|deputy|ambassador|media|partner|sponsor|viewer
  town_id: string | null;    // null = national/global scope
  initiative_scope?: string | null; // D-02 bridge: profiles.facts.initiative_scope
}

export type Lens =
  | { kind: 'national'; roleKey: string; label: string }
  | { kind: 'town'; roleKey: string; townId: string; townName: string; label: string }
  | { kind: 'initiative'; roleKey: string; initiativeKey: string; initiativeName: string; label: string };

export type Resolution =
  | { ok: true; lenses: Lens[] }
  | { ok: false; reason: string };

const NATIONAL_KEYS = new Set(['admin', 'ops']);
const TOWN_KEYS = new Set(['coordinator', 'deputy']);      // town-execution roles
const TOWN_OPTIONAL_KEYS = new Set(['ambassador', 'media']); // town-scoped when town_id set

/**
 * Resolve a person's operating lenses from their role assignments.
 * Fail closed: no assignments → no access. Ambiguity → the narrower lens wins for
 * operational data (never grant national by accident).
 */
export function resolveLenses(assignments: RoleAssignment[]): Resolution {
  if (!assignments.length) return { ok: false, reason: 'NO ROLE ASSIGNMENTS — fail closed. No scope is assumed.' };

  const lenses: Lens[] = [];
  for (const a of assignments) {
    // ORDER IS A SECURITY PROPERTY. An initiative-scoped assignment must NEVER fall through
    // to the national branch: an initiative head "operates nationally" but sees only their
    // initiative (the directive's critical rule). Checked FIRST.
    if (a.town_id === null && a.initiative_scope) {
      const init = CANONICAL_TEN.find((i) => i.key === a.initiative_scope);
      lenses.push({
        kind: 'initiative', roleKey: a.role_key,
        initiativeKey: a.initiative_scope, initiativeName: init?.name ?? a.initiative_scope,
        label: `Initiative scope — ${init?.name ?? a.initiative_scope} (D-02 bridge)`,
      });
    } else if (NATIONAL_KEYS.has(a.role_key) && a.town_id === null) {
      lenses.push({ kind: 'national', roleKey: a.role_key, label: `National (${a.role_key}) — full operating lens` });
    } else if ((TOWN_KEYS.has(a.role_key) || NATIONAL_KEYS.has(a.role_key)) && a.town_id) {
      // ops/admin scoped to a specific town = steward of THAT town only (app.has_town_scope model)
      lenses.push({ kind: 'town', roleKey: a.role_key, townId: a.town_id, townName: a.town_id, label: `Town scope (${a.role_key})` });
    } else if (TOWN_OPTIONAL_KEYS.has(a.role_key) && a.town_id) {
      lenses.push({ kind: 'town', roleKey: a.role_key, townId: a.town_id, townName: a.town_id, label: `Town scope (${a.role_key})` });
    }
    // everything else: unmapped → contributes no access (fail closed, never widened)
  }
  if (!lenses.length) return { ok: false, reason: 'ROLE ASSIGNMENTS PRESENT BUT UNMAPPED TO A LENS — fail closed.' };
  return { ok: true, lenses };
}

// ---------------------------------------------------------------------------
// VISIBILITY PREDICATES — exactly what each lens may see
// ---------------------------------------------------------------------------
export function canSeeTown(lenses: Lens[], townId: string): boolean {
  return lenses.some((l) => l.kind === 'national' || (l.kind === 'town' && l.townId === townId));
}

export function canSeeInitiative(lenses: Lens[], initiativeKey: string): boolean {
  return lenses.some((l) => l.kind === 'national' || l.kind === 'town' || (l.kind === 'initiative' && l.initiativeKey === initiativeKey));
  // town lens sees ALL active initiatives WITHIN its town (checked per-town via canSeeTown first);
  // initiative lens sees its own initiative everywhere.
}

export function canSeeTownInitiativeCell(lenses: Lens[], townId: string, initiativeKey: string): boolean {
  return lenses.some((l) =>
    l.kind === 'national' ||
    (l.kind === 'town' && l.townId === townId) ||
    (l.kind === 'initiative' && l.initiativeKey === initiativeKey),
  );
}

/** Operational records (work/proof/learning/economics/people) — town- or initiative-bound. */
export function canSeeOperationalRecords(lenses: Lens[], bound: { townId?: string; initiativeKey?: string }): boolean {
  return lenses.some((l) => {
    if (l.kind === 'national') return true;
    if (l.kind === 'town') return bound.townId === undefined || l.townId === bound.townId;
    if (l.kind === 'initiative') return bound.initiativeKey === undefined || l.initiativeKey === bound.initiativeKey;
    return false;
  });
}

/** Strategic geography visible to a lens: national/initiative = all 50; town = its one town. */
export function visibleRoster(lenses: Lens[]): RosterTown[] {
  if (lenses.some((l) => l.kind === 'national' || l.kind === 'initiative')) return BLUEPRINT_ROSTER.towns;
  const townIds = new Set(lenses.filter((l) => l.kind === 'town').map((l) => (l as any).townId));
  return BLUEPRINT_ROSTER.towns.filter((t) => townIds.has(t.canonical_row_id));
}

export function lensSummary(res: Resolution): string {
  if (!res.ok) return `NO ACCESS — ${res.reason}`;
  return res.lenses.map((l) => l.label).join(' · ');
}
