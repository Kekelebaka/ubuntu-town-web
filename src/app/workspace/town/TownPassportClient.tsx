'use client';

/**
 * TOWN PASSPORT — the blueprint's SEE surface for a town.
 *
 * Six facets we establish in every town: People · Economy · Assets ·
 * Opportunities · Initiatives · Proof. Each facet reads best-effort and
 * degrades to a calm "not captured yet" rather than an error when RLS or
 * absent enrichment returns nothing. Initiatives come from the blueprint
 * catalog (config/initiatives.ts) with tier badges; membership wiring is a
 * later gate, so they render informationally today.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useActor } from '@/lib/capabilities/useActor';
import { INITIATIVES, TIER_LABEL } from '@/config/initiatives';
import {
  Users, TrendingUp, Building2, Target, Boxes, ShieldCheck, MapPin,
  ChevronRight, Baby, ShoppingBag, Camera, Newspaper, Wrench, Home, Cpu,
  Mail, Music, Store, Sparkles, FileText,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<{ size?: number; color?: string }>> = {
  Baby, ShoppingBag, Camera, Newspaper, Wrench, Home, Cpu, Mail, Music, Store, Sparkles, FileText, Users,
};

interface Profile {
  economy_summary?: string | null; key_industries?: string | null;
  tourism_assets?: string | null; top_opportunities?: string | null;
  schools_note?: string | null; clinics_hospitals?: string | null;
  taxi_ranks?: string | null; shopping_centres?: string | null;
  population_estimate?: number | null; municipality?: string | null;
}

export default function TownPassportClient() {
  const { actor, town, signedIn, loading: actorLoading } = useActor();
  const townId = actor.activeTownId;
  const [people, setPeople] = useState(0);
  const [businesses, setBusinesses] = useState(0);
  const [opportunities, setOpportunities] = useState(0);
  const [published, setPublished] = useState(0);
  const [proofs, setProofs] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!townId) { setLoading(false); return; }
    const cnt = async (q: PromiseLike<{ count: number | null }>) => { try { const { count } = await q; return count ?? 0; } catch { return 0; } };
    const [p, b, o, pub] = await Promise.all([
      cnt(supabase.from('coordinators').select('id', { count: 'exact', head: true }).eq('town_id', townId)),
      cnt(supabase.from('businesses').select('id', { count: 'exact', head: true }).eq('town_id', townId)),
      cnt(supabase.from('opportunity_points').select('id', { count: 'exact', head: true }).eq('town_id', townId)),
      cnt(supabase.from('community_work').select('id', { count: 'exact', head: true }).eq('town_id', townId).eq('status', 'published').is('deleted_at', null)),
    ]);
    setPeople(p); setBusinesses(b); setOpportunities(o); setPublished(pub);
    try {
      const { data } = await supabase.from('town_profiles')
        .select('economy_summary,key_industries,tourism_assets,top_opportunities,schools_note,clinics_hospitals,taxi_ranks,shopping_centres,population_estimate,municipality')
        .eq('town_id', townId).maybeSingle();
      setProfile((data as Profile | null) ?? null);
    } catch { setProfile(null); }
    // proofs for this town's work (best-effort)
    try {
      const { data: works } = await supabase.from('community_work').select('id').eq('town_id', townId).is('deleted_at', null).limit(500);
      const ids = (works ?? []).map((w: { id: string }) => w.id);
      if (ids.length) { const { count } = await supabase.from('proofs').select('id', { count: 'exact', head: true }).in('community_work_id', ids); setProofs(count ?? 0); }
    } catch { /* ignore */ }
    setLoading(false);
  }, [townId]);

  useEffect(() => { if (!actorLoading) load(); }, [actorLoading, load]);

  if (!actorLoading && signedIn === false) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <MapPin size={44} color="var(--color-ubuntu-orange)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>Town Passport</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20 }}>Sign in to see your town.</p>
        <Link href="/login?next=/workspace/town" style={{ background: 'var(--color-ubuntu-orange)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
      </div>
    );
  }

  const facet = (icon: React.ComponentType<{ size?: number; color?: string }>, title: string, value: string, detail: string | null | undefined) => {
    const Icon = icon;
    return (
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Icon size={18} color="var(--color-ubuntu-purple)" />
          <span style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--muted-foreground)' }}>{title}</span>
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--foreground)', lineHeight: 1.1 }}>{value}</div>
        <p style={{ fontSize: 12.5, color: 'var(--muted-foreground)', margin: '6px 0 0', lineHeight: 1.5 }}>
          {detail && detail.trim() ? detail : <span style={{ fontStyle: 'italic' }}>Not captured yet</span>}
        </p>
      </div>
    );
  };

  return (
    <div>
      <div style={{ padding: '6px 2px 16px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>
          {town ? town.name : 'Town Passport'}
        </h1>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
          {loading ? 'Loading your town…' : profile?.municipality ? `${profile.municipality}${profile.population_estimate ? ` · ~${profile.population_estimate.toLocaleString('en-ZA')} people` : ''}` : 'What we establish in every town'}
        </p>
      </div>

      {/* Six facets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        {facet(Users, 'People', String(people), 'Coordinators & team in this town')}
        {facet(TrendingUp, 'Economy', String(businesses), profile?.economy_summary || profile?.key_industries)}
        {facet(Building2, 'Assets', [profile?.schools_note, profile?.clinics_hospitals, profile?.taxi_ranks, profile?.shopping_centres].filter(Boolean).length ? '✓' : '—', [profile?.schools_note, profile?.clinics_hospitals, profile?.shopping_centres].filter(Boolean).join(' · ') || null)}
        {facet(Target, 'Opportunities', String(opportunities), profile?.top_opportunities)}
        {facet(ShieldCheck, 'Proof', String(proofs), `${published} published ${published === 1 ? 'record' : 'records'}`)}
        {facet(Boxes, 'Initiatives', String(INITIATIVES.length), 'Capabilities available to this town')}
      </div>

      {/* Initiatives (blueprint catalog) */}
      <section>
        <h2 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-ubuntu-orange)', margin: '0 0 10px' }}>Initiatives</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {INITIATIVES.map(init => {
            const Icon = ICONS[init.icon] ?? Boxes;
            return (
              <div key={init.key} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ flex: 'none', width: 38, height: 38, borderRadius: 10, background: 'var(--secondary)', color: 'var(--color-ubuntu-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={19} /></span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>{init.name}</span>
                  <span style={{ display: 'block', fontSize: 11.5, color: 'var(--muted-foreground)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{init.blurb}</span>
                </span>
                <span title={TIER_LABEL[init.tier]} style={{ flex: 'none', fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', border: '1px solid var(--border)', borderRadius: 6, padding: '2px 6px' }}>{TIER_LABEL[init.tier]}</span>
              </div>
            );
          })}
        </div>
        <p style={{ fontSize: 12, color: 'var(--muted-foreground)', textAlign: 'center', margin: '14px 0 0' }}>
          Initiative teams & tools activate per town in a later release.
        </p>
      </section>
    </div>
  );
}
