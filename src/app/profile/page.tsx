'use client';
import { useCallback, useEffect, useState } from 'react';
import { User, Mail, MapPin, Shield, Camera, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

/**
 * /profile — the signed-in person's own identity.
 *
 * Everything rendered here comes from the authenticated session and from rows
 * the caller may already read under RLS — there is no hardcoded identity here
 * and none may be added:
 *   - email        — supabase.auth.getUser() (their own session)
 *   - display name — uto.coordinators.display_name (policy: self_coord,
 *                    id = auth.uid()). uto.profiles is still empty across the
 *                    estate, so it is deliberately not on this path.
 *   - roles        — uto.role_assignments (policy: self_roles,
 *                    user_id = auth.uid()) — the caller's own authority only
 *   - town         — uto.towns for their first town assignment (anon_read)
 * Fields without a real source render an explicit empty state. No schema change.
 */

interface ProfileData {
  displayName: string | null;
  email: string | null;
  roles: string[];
  townName: string | null;
}

const EMPTY_PROFILE: ProfileData = {
  displayName: null,
  email: null,
  roles: [],
  townName: null,
};

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [status, setStatus] = useState<'loading' | 'signed-out' | 'ready'>('loading');

  const load = useCallback(async () => {
    setStatus('loading');
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setProfile(EMPTY_PROFILE);
      setStatus('signed-out');
      return;
    }

    const [{ data: coordinator }, { data: roleRows }] = await Promise.all([
      supabase
        .from('coordinators')
        .select('display_name')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('role_assignments')
        .select('role_key, town_id')
        .eq('user_id', user.id),
    ]);

    const roles = (roleRows ?? []).map((r) => r.role_key as string);
    const townId = (roleRows ?? [])
      .map((r) => r.town_id as string | null)
      .find(Boolean) ?? null;

    let townName: string | null = null;
    if (townId) {
      const { data: town } = await supabase
        .from('towns')
        .select('name')
        .eq('id', townId)
        .maybeSingle();
      townName = town?.name ?? null;
    }

    setProfile({
      displayName:
        coordinator?.display_name ??
        (user.email ? user.email.split('@')[0] : null),
      email: user.email ?? null,
      roles,
      townName,
    });
    setStatus('ready');
  }, []);

  useEffect(() => {
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => sub.subscription.unsubscribe();
  }, [load]);

  return (
    <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light">
      {/* Header */}
      <div className="border-b border-ubuntu-border bg-ubuntu-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-ubuntu-light">Profile</h1>
          <p className="text-muted-foreground">Your Ubuntu Town profile</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {status === 'loading' && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading your profile…
          </div>
        )}

        {status === 'signed-out' && (
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
            <p className="text-ubuntu-light">You are not signed in.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Sign in to see your profile.
            </p>
          </div>
        )}

        {status === 'ready' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-ubuntu-orange to-ubuntu-purple flex items-center justify-center mb-4 relative">
                    <User className="w-12 h-12 text-white" />
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-ubuntu-dark border border-ubuntu-border rounded-full flex items-center justify-center hover:border-ubuntu-orange transition-colors">
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-xl font-bold text-ubuntu-light">
                    {profile.displayName ?? 'Your profile'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {profile.townName ? `@${profile.townName}` : 'No town context yet'}
                  </p>
                  <div className="mt-4">
                    {profile.roles.length > 0 ? (
                      <span className="text-xs bg-ubuntu-purple/20 text-ubuntu-purple px-3 py-1 rounded-full capitalize">
                        {profile.roles.join(' · ')}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground px-3 py-1">
                        No role assignments yet
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2">
              <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Email</div>
                        <div className="text-ubuntu-light">
                          {profile.email ?? <EmptyState label="Not available" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Town</div>
                        <div className="text-ubuntu-light">
                          {profile.townName ?? <EmptyState label="No town assignment" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="text-sm text-muted-foreground">Roles</div>
                        <div className="text-ubuntu-light capitalize">
                          {profile.roles.length > 0
                            ? profile.roles.join(', ')
                            : <EmptyState label="No role assignments" />}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm text-muted-foreground mb-2">About</h3>
                    <EmptyState label="No bio yet" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return <span className="text-muted-foreground italic">{label}</span>;
}
