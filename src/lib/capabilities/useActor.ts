'use client';

/**
 * Loads the real actor context: who is signed in, which role assignments they
 * hold, and which town they are operating in.
 *
 * Reads only what row-level security already permits. `uto.role_assignments`
 * is readable by the holder, so this returns the caller's own authority and
 * nothing else — the hook cannot be used to enumerate anyone else's roles.
 *
 * Active town: the person's first town assignment, overridable via the town
 * switcher and remembered locally. National operators may hold no town
 * assignment at all, which is why activeTownId is legitimately nullable.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { EMPTY_ACTOR, type ActorContext, type RoleAssignment } from './resolve';

const ACTIVE_TOWN_KEY = 'ubuntu.activeTownId';

export interface ActorState {
  actor: ActorContext;
  town: { id: string; name: string; slug: string } | null;
  displayName: string | null;
  loading: boolean;
  /** Distinguishes "still loading" from "genuinely signed out". */
  signedIn: boolean | null;
  setActiveTown: (townId: string) => void;
  reload: () => Promise<void>;
}

export function useActor(): ActorState {
  const [actor, setActor] = useState<ActorContext>(EMPTY_ACTOR);
  const [town, setTown] = useState<{ id: string; name: string; slug: string } | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setActor(EMPTY_ACTOR);
      setTown(null);
      setSignedIn(false);
      setLoading(false);
      return;
    }
    setSignedIn(true);

    const { data: rows } = await supabase
      .from('role_assignments')
      .select('role_key, town_id')
      .eq('user_id', user.id);

    const assignments = (rows ?? []) as RoleAssignment[];

    // Prefer a remembered town, but only if the person actually holds it.
    const remembered =
      typeof window !== 'undefined' ? window.localStorage.getItem(ACTIVE_TOWN_KEY) : null;
    const ownTowns = assignments.map(a => a.town_id).filter(Boolean) as string[];
    const activeTownId =
      (remembered && ownTowns.includes(remembered) ? remembered : null) ?? ownTowns[0] ?? null;

    setActor({ userId: user.id, assignments, activeTownId, memberships: [] });

    if (activeTownId) {
      const { data: t } = await supabase
        .from('towns')
        .select('id, name, slug')
        .eq('id', activeTownId)
        .single();
      setTown(t ?? null);
    } else {
      setTown(null);
    }

    // uto.coordinators carries the human-facing name. uto.profiles is still
    // empty across the estate, so it is deliberately not on this path.
    const { data: coordinator } = await supabase
      .from('coordinators')
      .select('display_name')
      .eq('id', user.id)
      .maybeSingle();

    setDisplayName(
      coordinator?.display_name
        ?? (user.email ? user.email.split('@')[0] : null),
    );

    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  const setActiveTown = useCallback((townId: string) => {
    if (typeof window !== 'undefined') window.localStorage.setItem(ACTIVE_TOWN_KEY, townId);
    setActor(prev => ({ ...prev, activeTownId: townId }));
    void load();
  }, [load]);

  return { actor, town, displayName, loading, signedIn, setActiveTown, reload: load };
}
