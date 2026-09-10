'use client';

/**
 * Personal Passport — minimum truthful version for release.
 *
 * Shows: identity, town, verified work count, recent verified proof,
 * capability evidence. No fake levels, percentages, or rankings.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useActor } from '@/lib/capabilities/useActor';
import { IdCard, MapPin, CheckCircle, Shield, Briefcase } from 'lucide-react';

interface Capability {
  id: string;
  capability: string;
  evidence_level: string;
  verified_at: string;
  mission_id: string;
}

interface VerifiedMission {
  id: string;
  title: string;
  completed_at: string;
}

export default function PersonalPassportClient() {
  const { actor, town, displayName, loading: actorLoading, signedIn } = useActor();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [verifiedMissions, setVerifiedMissions] = useState<VerifiedMission[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!actor.userId) return;

    // Load capability evidence
    const { data: caps } = await supabase.rpc('get_my_capabilities');
    setCapabilities((caps as Capability[]) ?? []);

    // Load verified missions assigned to this user
    const { data: missions } = await supabase
      .from('work_missions')
      .select('id, title, completed_at')
      .eq('assigned_to', actor.userId)
      .eq('status', 'verified')
      .order('completed_at', { ascending: false })
      .limit(10);
    setVerifiedMissions((missions as VerifiedMission[]) ?? []);

    setLoading(false);
  }, [actor.userId]);

  useEffect(() => { if (!actorLoading) load(); }, [actorLoading, load]);

  if (!actorLoading && signedIn === false) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <IdCard size={44} color="var(--ut-orange)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>Passport</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20 }}>Sign in to see your passport.</p>
        <Link href="/login?next=/workspace/passport" style={{ background: 'var(--ut-orange)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '6px 2px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ut-ink)', margin: 0, letterSpacing: '-0.02em' }}>Passport</h1>
        <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: '4px 0 0' }}>
          {loading ? 'Loading…' : 'Your journey, evidence and capabilities'}
        </p>
      </div>

      {/* Identity card */}
      <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--ut-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 22, fontWeight: 800 }}>
            {displayName ? displayName.charAt(0).toUpperCase() : '?'}
          </div>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ut-ink)', margin: 0 }}>{displayName || 'Member'}</h2>
            {town && (
              <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={13} /> {town.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Verified work */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>
          Verified Work ({verifiedMissions.length})
        </h2>
        {verifiedMissions.length === 0 ? (
          <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <Briefcase size={32} color="var(--ut-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--ut-muted)' }}>No verified work yet.</p>
            <p style={{ fontSize: 12, color: 'var(--ut-muted)', marginTop: 4 }}>Complete missions to build your evidence.</p>
            <Link href="/workspace/today" style={{ display: 'inline-block', marginTop: 12, background: 'var(--ut-orange)', color: '#fff', padding: '8px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
              Go to Today
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {verifiedMissions.map(m => (
              <div key={m.id} style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={20} color="#065F46" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>{m.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--ut-muted)', margin: '2px 0 0' }}>
                    Verified {m.completed_at ? new Date(m.completed_at).toLocaleDateString('en-ZA') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Capability evidence */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>
          Capabilities ({capabilities.length})
        </h2>
        {capabilities.length === 0 ? (
          <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <Shield size={32} color="var(--ut-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: 'var(--ut-muted)' }}>No capability evidence yet.</p>
            <p style={{ fontSize: 12, color: 'var(--ut-muted)', marginTop: 4 }}>Verified missions award capability evidence.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {capabilities.map(c => (
              <div key={c.id} style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Shield size={20} color="var(--ut-aubergine)" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>
                    {c.capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ut-muted)', margin: '2px 0 0' }}>
                    Level: {c.evidence_level} · Verified {new Date(c.verified_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}