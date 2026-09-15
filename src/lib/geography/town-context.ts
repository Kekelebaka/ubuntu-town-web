/**
 * Town Context — Canonical typed context for Northstar convergence.
 * 
 * Replaces ad-hoc town resolution with explicitly distinct states:
 * - discoveryProvince: province being explored (public)
 * - discoveryTown: town being explored (public)
 * - townInterest: expressed interest (does NOT grant authority)
 * - rememberedTown: last selected town from localStorage
 * - allowedOperationalTowns: towns where actor has role assignments
 * - activeOperationalTown: currently selected operational town
 * - activeProvince: derived from activeOperationalTown
 * 
 * CRITICAL: townInterest NEVER grants operational authority.
 * Authority derives from role_assignments only.
 */

import type { CanonicalTown, CanonicalProvince } from './canonical-register';

// ============================================================
// Context State Types
// ============================================================

/** States a town context can be in */
export type TownContextState = 
  | 'loading'              // Still loading
  | 'signed_out'           // No auth, browsing publicly
  | 'signed_in'            // Authenticated but no town context yet
  | 'discovering'          // Authenticated, exploring provinces/towns
  | 'interest_expressed'   // Authenticated, expressed interest in a town (NO authority)
  | 'town_assigned'        // Authenticated, has role assignment in at least one town
  | 'town_active'          // Authenticated, operational town selected and resolved
  | 'town_unresolved'      // Authenticated, has assignments but town not found
  | 'town_revoked'         // Authenticated, previously active town no longer assigned
  | 'town_stale';          // Authenticated, remembered town no longer valid

/** What the town context projection can report */
export type TownProjectionState =
  | 'missing'              // No town context at all
  | 'genuine_zero'         // Town exists but has zero items (valid)
  | 'unauthorised'         // Actor has no authority in this town
  | 'unresolved'           // Town ID exists but town record not found
  | 'not_calculated'       // Metric not yet computed
  | 'stale_offline'        // Data is stale or offline
  | 'failed';              // Computation failed

// ============================================================
// Context Objects
// ============================================================

/** Discovery context — public browsing, no auth required */
export interface DiscoveryContext {
  type: 'discovery';
  province: CanonicalProvince | null;
  town: CanonicalTown | null;
}

/** Town interest — expressed but NO authority granted */
export interface TownInterest {
  type: 'interest';
  townId: string;
  townName: string;
  expressedAt: string;   // ISO timestamp
  // NOTE: This NEVER grants roles or operational access
}

/** Operational town context — derived from role_assignments */
export interface OperationalTownContext {
  type: 'operational';
  townId: string;
  townName: string;
  townSlug: string;
  province: string;
  provinceSlug: string;
  roles: string[];       // Roles held in this town
  isNational: boolean;   // National scope (admin/ops with town_id IS NULL)
}

/** The complete actor-town context */
export interface ActorTownContext {
  /** Current authentication state */
  authState: 'loading' | 'signed_out' | 'signed_in';
  
  /** User ID from auth */
  userId: string | null;
  
  /** Overall context state */
  state: TownContextState;
  
  /** Discovery context (public browsing) */
  discovery: DiscoveryContext;
  
  /** Expressed town interests (never grants authority) */
  interests: TownInterest[];
  
  /** Towns where actor has role assignments */
  allowedOperationalTowns: OperationalTownContext[];
  
  /** Currently active operational town (null if none selected) */
  activeOperationalTown: OperationalTownContext | null;
  
  /** Province derived from active operational town */
  activeProvince: CanonicalProvince | null;
  
  /** Display name for the actor */
  displayName: string | null;
  
  /** Whether context is still loading */
  loading: boolean;
}

/** Operational metric with state awareness */
export interface OperationalMetric<T> {
  value: T | null;
  state: TownProjectionState;
  computedAt: string | null;
  error?: string;
}

/** Canonical town operational state projection */
export interface TownStateProjection {
  townId: string;
  townName: string;
  province: string;
  
  // Count metrics with state awareness
  signals: OperationalMetric<number>;
  workItems: OperationalMetric<number>;
  publishedWork: OperationalMetric<number>;
  pendingReview: OperationalMetric<number>;
  missions: OperationalMetric<number>;
  activeCoordinators: OperationalMetric<number>;
  
  // Lifecycle state
  readiness: OperationalMetric<number>;
  lastActivity: OperationalMetric<string>;
  
  // Overall projection state
  overallState: TownProjectionState;
}

// ============================================================
// Initial/Empty States
// ============================================================

export const EMPTY_DISCOVERY: DiscoveryContext = {
  type: 'discovery',
  province: null,
  town: null,
};

export const EMPTY_ACTOR_TOWN_CONTEXT: ActorTownContext = {
  authState: 'loading',
  userId: null,
  state: 'signed_out',
  discovery: EMPTY_DISCOVERY,
  interests: [],
  allowedOperationalTowns: [],
  activeOperationalTown: null,
  activeProvince: null,
  displayName: null,
  loading: true,
};

export function createEmptyMetric<T>(state: TownProjectionState = 'not_calculated'): OperationalMetric<T> {
  return {
    value: null,
    state,
    computedAt: null,
  };
}

export function createEmptyProjection(townId: string, townName: string, province: string): TownStateProjection {
  return {
    townId,
    townName,
    province,
    signals: createEmptyMetric(),
    workItems: createEmptyMetric(),
    publishedWork: createEmptyMetric(),
    pendingReview: createEmptyMetric(),
    missions: createEmptyMetric(),
    activeCoordinators: createEmptyMetric(),
    readiness: createEmptyMetric(),
    lastActivity: createEmptyMetric(),
    overallState: 'not_calculated',
  };
}
