'use client';

/**
 * Opportunities — truthful empty state for Build 02 release.
 *
 * Shows real opportunity data from the town if available.
 * Otherwise shows a truthful empty state with no fabricated content.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useActor } from '@/lib/capabilities/useActor';
import { Target, MapPin } from 'lucide-react';

interface Opportunity {
  id: string;
  title: string;
  description: string | null;
  town_id: string;
  created_at: string;
}

export default function OpportunitiesClient() {
  const { actor, town, signedIn, loading: actorLoading } = useActor();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);

  const townId = actor.activeTownId;

  const load = useCallback(async () => {
    if (!actor.userId || !townId) { setLoading(false); return; }

    try {
      const { data } = await supabase
        .from('opportunity_points')
        .select('id,title,description,town_id,created_at')
        .eq('town_id', townId)
        .order('created_at', { ascending: false })
        .limit(20);
      setOpportunities((data as Opportunity[]) ?? []);
    } catch {
      setOpportunities([]);
    }
    setLoading(false);
  }, [actor.userId, townId]);

  useEffect(() => { if (!actorLoading) load(); }, [actorLoading, load]);

  if (!actorLoading && signedIn === false) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <Target size={44} color="var(--ut-orange)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>Opportunities</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20 }}>Sign in to see opportunities in your town.</p>
        <Link href="/login?next=/workspace/opportunities" style={{ background: 'var(--ut-orange)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: '6px 2px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ut-ink)', margin: 0, letterSpacing: '-0.02em' }}>Opportunities</h1>
        <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
          {town && <><MapPin size={13} /> {town.name} · </>}
          {loading ? 'Loading…' : `${opportunities.length} available`}
        </p>
      </div>

      {loading ? (
        <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: 'var(--ut-muted)' }}>Loading…</p>
        </div>
      ) : opportunities.length === 0 ? (
        <div style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 24, textAlign: 'center' }}>
          <Target size={32} color="var(--ut-muted)" style={{ margin: '0 auto 12px' }} />
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ut-ink)', margin: '0 0 6px' }}>No opportunities yet</p>
          <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: 0, maxWidth: 320, marginLeft: 'auto', marginRight: 'auto' }}>
            Opportunities from your town and the Ubuntu Town network will appear here as they become available.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {opportunities.map(op => (
            <div key={op.id} style={{ background: 'var(--ut-surface)', border: '1px solid var(--ut-border)', borderRadius: 14, padding: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ut-ink)', margin: '0 0 6px' }}>{op.title}</h3>
              {op.description && <p style={{ fontSize: 13, color: 'var(--ut-muted)', margin: 0 }}>{op.description}</p>}
              <p style={{ fontSize: 11, color: 'var(--ut-muted)', margin: '6px 0 0' }}>
                {new Date(op.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
