/**
 * Capability resolution — pure, synchronous, testable.
 *
 * Turns "who is this person, where, and with what role assignments" into
 * "what should the shell offer them".
 *
 * This is a COMPOSITION decision, never an authorization decision. Resolving a
 * capability to `true` means the button is worth showing; the database still
 * decides whether the action succeeds. Resolving to `false` is a courtesy — it
 * keeps people out of dead ends, not out of data.
 *
 * The national rule mirrors app.is_national(): admin or ops with town_id IS
 * NULL. It is duplicated here ONLY to decide what to render. If the two ever
 * disagree, the database wins and the user sees a refusal — which is the
 * correct failure mode, and why this file can never grant anything.
 */

import { CAPABILITIES, type Capability, type InitiativeKey, type RoleKey, type Surface } from '@/config/capabilities';

export interface RoleAssignment {
  role_key: RoleKey;
  /** null => national scope */
  town_id: string | null;
}

export interface ActorContext {
  userId: string | null;
  assignments: RoleAssignment[];
  /** The town the person is currently operating in. */
  activeTownId: string | null;
  /** Initiative memberships. Empty until the membership model becomes canonical. */
  memberships: InitiativeKey[];
}

export const EMPTY_ACTOR: ActorContext = {
  userId: null,
  assignments: [],
  activeTownId: null,
  memberships: [],
};

/** Mirrors app.is_national(): admin/ops holding a NATIONAL (town_id IS NULL) assignment. */
export function isNational(actor: ActorContext): boolean {
  return actor.assignments.some(
    a => a.town_id === null && (a.role_key === 'admin' || a.role_key === 'ops'),
  );
}

/** Roles the actor holds in a given town. National roles apply to every town. */
export function rolesInTown(actor: ActorContext, townId: string | null): RoleKey[] {
  if (!townId) return actor.assignments.filter(a => a.town_id === null).map(a => a.role_key);
  return actor.assignments
    .filter(a => a.town_id === townId || a.town_id === null)
    .map(a => a.role_key);
}

/** Every town the actor has any assignment in. Drives the town switcher. */
export function townsForActor(actor: ActorContext): string[] {
  return Array.from(new Set(actor.assignments.map(a => a.town_id).filter(Boolean) as string[]));
}

export function hasCapability(actor: ActorContext, capability: Capability): boolean {
  const { requires } = capability;
  const national = isNational(actor);

  // Signed out: nothing composes. The sign-in gate handles this case.
  if (!actor.userId) return false;

  if (requires.national && !national) return false;

  if (requires.town && !actor.activeTownId && !national) return false;

  if (requires.roles && requires.roles.length > 0) {
    if (!national) {
      const held = rolesInTown(actor, actor.activeTownId);
      if (!requires.roles.some(r => held.includes(r))) return false;
    }
  }

  if (requires.membership) {
    // National operators oversee initiatives without being members of them.
    if (!national && !actor.memberships.includes(requires.membership)) return false;
  }

  return true;
}

/** All capabilities this actor may be offered. */
export function resolveCapabilities(actor: ActorContext): Capability[] {
  return CAPABILITIES.filter(c => hasCapability(actor, c));
}

/** Capabilities for one surface, e.g. the universal + sheet or the More menu. */
export function capabilitiesForSurface(actor: ActorContext, surface: Surface): Capability[] {
  return resolveCapabilities(actor).filter(c => c.surfaces.includes(surface));
}

export function can(actor: ActorContext, key: string): boolean {
  const capability = CAPABILITIES.find(c => c.key === key);
  return capability ? hasCapability(actor, capability) : false;
}

/**
 * A short, human description of why the shell is composed this way.
 * Useful in Settings and invaluable in support conversations — a coordinator
 * who cannot see a button deserves to know why.
 */
export function describeAuthority(actor: ActorContext): string {
  if (!actor.userId) return 'Signed out';
  if (isNational(actor)) return 'National operations — every town';
  const roles = Array.from(new Set(rolesInTown(actor, actor.activeTownId)));
  if (roles.length === 0) return 'Community member';
  return roles.join(', ');
}
