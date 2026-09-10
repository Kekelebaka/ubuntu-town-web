'use client';

/**
 * Grow — minimum truthful surface for release.
 *
 * Shows: what you've demonstrated, what you've completed, what you can try next.
 * Derived from actual evidence. No fabricated curriculum or progression scores.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useActor } from '@/lib/capabilities/useActor';
import { TrendingUp, CheckCircle, ArrowRight } from 'lucide-react';

interface Capability {
  id: string;
  capability: string;
  evidence_level: string;
  verified_at: string;
}

export default function GrowClient() {
  const { actor, signedIn, loading: actorLoading } = useActor();
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [verifiedCount, setVerifiedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!actor.userId) return;

    const { data: caps } = await supabase.rpc('get_my_capabilities');
    setCapabilities((caps as Capability[]) ?? []);

    const { count } = await supabase
      .from('missions')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', actor.userId)
      .eq('status', 'verified');
    setVerifiedCount(count ?? 0);

    setLoading(false);
  }, [actor.userId]);

  useEffect(() => { if (!actorLoading) load(); }, [actorLoading, load]);

  if (!actorLoading && signedIn === false) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <TrendingUp size={44} color="var(--ut-orange)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>Grow</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20 }}>Sign in to see your progress.</p>
        <Link href="/login?next=/workspace/grow" style={{ background: 'var(--ut-orange)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
      </div>
    );
  }

  const capNames = capabilities.map(c =>
    c.capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  );

  return (
    <div>
      <div style={{ padding: '6px 2px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ut-ink)', margin: 0, letterSpacing: '-0.02em' }}>Grow</h1>
        <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: '4px 0 0' }}>
          {loading ? 'Loading…' : 'Your progress and what you can try next'}
        </p>
      </div>

      {/* What you've demonstrated */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>
          What you've demonstrated
        </h2>
        {capabilities.length === 0 ? (
          <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--ut-muted)' }}>No capabilities demonstrated yet.</p>
            <p style={{ fontSize: 12, color: 'var(--ut-muted)', marginTop: 4 }}>
              Complete and verify missions to build your capability record.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {capabilities.map(c => (
              <div key={c.id} style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={20} color="#065F46" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>
                    {c.capability.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p style={{ fontSize: 12, color: 'var(--ut-muted)', margin: '2px 0 0' }}>
                    {c.evidence_level} · Verified {new Date(c.verified_at).toLocaleDateString('en-ZA')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* What you've completed */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>
          Completed
        </h2>
        <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 20 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--ut-aubergine)' }}>{verifiedCount}</div>
          <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: '4px 0 0' }}>
            {verifiedCount === 1 ? 'mission' : 'missions'} verified
          </p>
        </div>
      </section>

      {/* What you can try next */}
      <section style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ut-orange)', margin: '0 0 10px' }}>
          What you can try next
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {verifiedCount === 0 && (
            <Link href="/workspace/today" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <ArrowRight size={20} color="var(--ut-orange)" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>Complete your first mission</p>
                  <p style={{ fontSize: 12, color: 'var(--ut-muted)', margin: '2px 0 0' }}>Start with a Verify Local Business mission to build your first capability.</p>
                </div>
              </div>
            </Link>
          )}
          {verifiedCount > 0 && !capNames.includes('Local Intelligence') && (
            <Link href="/workspace/today" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                <ArrowRight size={20} color="var(--ut-orange)" />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>Earn Local Intelligence capability</p>
                  <p style={{ fontSize: 12, color: 'var(--ut-muted)', margin: '2px 0 0' }}>Verify a local business to demonstrate your town knowledge.</p>
                </div>
              </div>
            </Link>
          )}
          <Link href="/workspace/town" style={{ textDecoration: 'none' }}>
            <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
              <ArrowRight size={20} color="var(--ut-orange)" />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--ut-ink)', margin: 0 }}>Explore your Town Passport</p>
                <p style={{ fontSize: 12, color: 'var(--ut-muted)', margin: '2px 0 0' }}>See your town's readiness and what would help most.</p>
              </div>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
