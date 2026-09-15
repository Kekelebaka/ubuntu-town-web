'use client';

/**
 * useActorContext — Enhanced actor context hook for Northstar convergence.
 * 
 * Replaces the simple useActor hook with a comprehensive town context system
 * that implements the canonical context model:
 * 
 * Authenticated actor
 * → canonical person
 * → role assignments
 * → permissions
 * → allowed operational towns
 * → selected active operational town
 * → derived province
 * → canonical town-state projection
 * 
 * CRITICAL RULES:
 * 1. Never use user-editable metadata for authorization
 * 2. A town interest NEVER grants a role
 * 3. Never silently select an unauthorised town
 * 4. Do not display operational metrics until active-town resolution succeeds
 * 5. Replace "town:unknown" with a blocked recovery state
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getTownBySlug, getProvinceForTown, type CanonicalTown, type CanonicalProvince } from './canonical-register';
import {
  type ActorTownContext,
  type OperationalTownContext,
  type TownInterest,
  type DiscoveryContext,
  EMPTY_ACTOR_TOWN_CONTEXT,
  EMPTY_DISCOVERY,
} from './town-context';

const ACTIVE_TOWN_KEY = 'ubuntu.activeTownId';
const INTERESTS_KEY = 'ubuntu.townInterests';

interface RoleAssignment {
  role_key: string;
  town_id: string | null;
}

export interface ActorContextReturn {
  context: ActorTownContext;
  setActiveTown: (townId: string) => void;
  expressInterest: (townId: string, townName: string) => void;
  clearInterest: (townId: string) => void;
  setDiscovery: (province: CanonicalProvince | null, town: CanonicalTown | null) => void;
  reload: () => Promise<void>;
}

export function useActorContext(): ActorContextReturn {
  const [context, setContext] = useState<ActorTownContext>(EMPTY_ACTOR_TOWN_CONTEXT);

  const load = useCallback(async () => {
    setContext(prev => ({ ...prev, loading: true }));

    // Step 1: Check authentication
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setContext({
        ...EMPTY_ACTOR_TOWN_CONTEXT,
        authState: 'signed_out',
        loading: false,
      });
      return;
    }

    // Step 2: Load role assignments (the ONLY source of authority)
    const { data: assignments, error: assignError } = await supabase
      .from('role_assignments')
      .select('role_key, town_id')
      .eq('user_id', user.id);

    if (assignError) {
      console.error('[useActorContext] Failed to load role assignments:', assignError);
      setContext(prev => ({
        ...prev,
        authState: 'signed_in',
        userId: user.id,
        state: 'town_unresolved',
        loading: false,
      }));
      return;
    }

    const roleAssignments = (assignments ?? []) as RoleAssignment[];

    // Step 3: Derive national scope
    const isNational = roleAssignments.some(
      a => a.town_id === null && (a.role_key === 'admin' || a.role_key === 'ops')
    );

    // Step 4: Build allowed operational towns (from role_assignments ONLY)
    const townIds = new Set<string>(
      roleAssignments
        .map(a => a.town_id)
        .filter((id): id is string => id !== null)
    );

    const allowedOperationalTowns: OperationalTownContext[] = [];
    const townIdsArray = Array.from(townIds);
    for (const townId of townIdsArray) {
      // Look up town from canonical register by matching against database
      // For now, we'll build from what we have and let the town lookup happen below
      const roles = roleAssignments
        .filter(a => a.town_id === townId || (a.town_id === null && isNational))
        .map(a => a.role_key);

      allowedOperationalTowns.push({
        type: 'operational',
        townId,
        townName: '', // Will be resolved below
        townSlug: '',
        province: '',
        provinceSlug: '',
        roles,
        isNational,
      });
    }

    // Step 5: Resolve town names for operational towns
    for (const opTown of allowedOperationalTowns) {
      const { data: townData } = await supabase
        .from('towns')
        .select('id, name, slug, province')
        .eq('id', opTown.townId)
        .single();

      if (townData) {
        opTown.townName = townData.name;
        opTown.townSlug = townData.slug;
        opTown.province = townData.province;
        
        // Try to derive province slug from canonical register
        const canonicalTown = getTownBySlug(townData.slug);
        if (canonicalTown) {
          opTown.provinceSlug = canonicalTown.provinceSlug;
        }
      }
    }

    // Step 6: Select active operational town
    let activeTownId: string | null = null;
    let state: ActorTownContext['state'] = 'signed_in';

    // Check localStorage for remembered town
    const remembered = typeof window !== 'undefined' 
      ? window.localStorage.getItem(ACTIVE_TOWN_KEY) 
      : null;

    if (isNational && !remembered) {
      // National operators without a remembered town: no active town
      state = 'town_assigned';
    } else if (remembered && townIds.has(remembered)) {
      // Remembered town is still valid
      activeTownId = remembered;
      state = 'town_active';
    } else if (remembered && !townIds.has(remembered)) {
      // Remembered town is no longer assigned — stale
      state = 'town_stale';
      // Clear the stale selection
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(ACTIVE_TOWN_KEY);
      }
      // Fall back to first assigned town
      const firstTown = Array.from(townIds)[0];
      activeTownId = firstTown ?? null;
      if (activeTownId) state = 'town_active';
    } else if (townIds.size > 0) {
      // No remembered town, use first assignment
      const firstTown = Array.from(townIds)[0];
      activeTownId = firstTown ?? null;
      state = 'town_active';
    } else {
      // No town assignments at all
      state = 'discovering';
    }

    // Step 7: Build active operational town context
    const activeOperationalTown = activeTownId
      ? allowedOperationalTowns.find(t => t.townId === activeTownId) ?? null
      : null;

    // Step 8: Derive province from active town
    const activeProvince = activeOperationalTown
      ? getProvinceForTown(activeOperationalTown.townSlug) ?? null
      : null;

    // Step 9: Load display name
    const { data: coordinator } = await supabase
      .from('coordinators')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    const displayName = coordinator?.display_name
      ?? (user.email ? user.email.split('@')[0] : null);

    // Step 10: Load expressed interests (from localStorage)
    const interestsJson = typeof window !== 'undefined'
      ? window.localStorage.getItem(INTERESTS_KEY)
      : null;
    const interests: TownInterest[] = interestsJson ? JSON.parse(interestsJson) : [];

    // Step 11: Set final context
    setContext({
      authState: 'signed_in',
      userId: user.id,
      state,
      discovery: context.discovery, // Preserve current discovery context
      interests,
      allowedOperationalTowns,
      activeOperationalTown,
      activeProvince,
      displayName,
      loading: false,
    });
  }, []);

  // Load on mount and auth state change
  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  // Set active town
  const setActiveTown = useCallback((townId: string) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ACTIVE_TOWN_KEY, townId);
    }
    // Trigger reload to re-resolve everything
    void load();
  }, [load]);

  // Express interest in a town (NEVER grants authority)
  const expressInterest = useCallback((townId: string, townName: string) => {
    const interest: TownInterest = {
      type: 'interest',
      townId,
      townName,
      expressedAt: new Date().toISOString(),
    };

    setContext(prev => {
      const existing = prev.interests.filter(i => i.townId !== townId);
      const newInterests = [...existing, interest];
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(INTERESTS_KEY, JSON.stringify(newInterests));
      }

      return { ...prev, interests: newInterests, state: 'interest_expressed' };
    });
  }, []);

  // Clear interest
  const clearInterest = useCallback((townId: string) => {
    setContext(prev => {
      const newInterests = prev.interests.filter(i => i.townId !== townId);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(INTERESTS_KEY, JSON.stringify(newInterests));
      }

      return { ...prev, interests: newInterests };
    });
  }, []);

  // Set discovery context (public browsing)
  const setDiscovery = useCallback((province: CanonicalProvince | null, town: CanonicalTown | null) => {
    setContext(prev => ({
      ...prev,
      discovery: { type: 'discovery', province, town },
    }));
  }, []);

  return {
    context,
    setActiveTown,
    expressInterest,
    clearInterest,
    setDiscovery,
    reload: load,
  };
}

// ============================================================
// Derived Selectors (pure, testable)
// ============================================================

/** Is this actor a national operator? */
export function isNationalOperator(context: ActorTownContext): boolean {
  return context.activeOperationalTown?.isNational ?? false;
}

/** Does this actor have any operational authority? */
export function hasOperationalAuthority(context: ActorTownContext): boolean {
  return context.allowedOperationalTowns.length > 0 || isNationalOperator(context);
}

/** Can this actor operate in a specific town? */
export function canOperateInTown(context: ActorTownContext, townId: string): boolean {
  if (isNationalOperator(context)) return true;
  return context.allowedOperationalTowns.some(t => t.townId === townId);
}

/** Get roles for the active town */
export function getActiveTownRoles(context: ActorTownContext): string[] {
  return context.activeOperationalTown?.roles ?? [];
}

/** Is the active town context ready for operational display? */
export function isOperationalContextReady(context: ActorTownContext): boolean {
  return context.state === 'town_active' && context.activeOperationalTown !== null;
}

/** Get a human-readable description of the current context state */
export function describeContextState(context: ActorTownContext): string {
  switch (context.state) {
    case 'signed_out':
      return 'Signed out — browsing publicly';
    case 'discovering':
      return 'Discovering Ubuntu Town';
    case 'interest_expressed':
      return `Interest expressed in ${context.interests.length} town(s) — no operational access`;
    case 'town_assigned':
      return 'Has town assignments — select a town to operate';
    case 'town_active':
      return `Operating in ${context.activeOperationalTown?.townName ?? 'unknown town'}`;
    case 'town_unresolved':
      return 'Town assignments exist but could not be resolved';
    case 'town_revoked':
      return 'Previously active town is no longer assigned';
    case 'town_stale':
      return 'Remembered town is no longer valid — reassigned';
    default:
      return 'Unknown context state';
  }
}
