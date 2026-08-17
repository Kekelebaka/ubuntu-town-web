'use client';

/**
 * MY PEOPLE — the coordinator's CONNECT surface (blueprint People layer).
 *
 * "Who am I responsible for?" Lists the people in the coordinator's town by
 * merging role_assignments (who holds which role) with the coordinators
 * directory (name, phone, status). Reads are town-scoped by RLS
 * (town_read_coordinators / town_read_roles via app.has_town_scope) — this
 * component shows exactly what the database returns and never widens it. A
 * coordinator sees their town; national sees all; nobody sees another town.
 *
 * Invitations (bringing new people in) are the next increment; the "Invite
 * person" action is surfaced but marked coming-soon until that lands.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { useActor } from '@/lib/capabilities/useActor';
import { Users, Phone, UserPlus, ShieldCheck } from 'lucide-react';

interface Person {
  id: string;
  name: string;
  phone: string | null;
  status: string | null;
  roles: string[];
}

const ROLE_LABEL: Record<string, string> = {
  admin: 'Admin', ops: 'Ops', coordinator: 'Coordinator', deputy: 'Deputy',
  ambassador: 'Ambassador', media: 'Media', partner: 'Partner', sponsor: 'Sponsor', viewer: 'Viewer',
};

export default function PeopleClient() {
  const { actor, town, signedIn, loading: actorLoading } = useActor();
  const townId = actor.activeTownId;
  const [people, setPeople] = useState<Person[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!townId) { setLoading(false); return; }
    const byId = new Map<string, Person>();

    try {
      const { data: coords } = await supabase
        .from('coordinators')
        .select('id, display_name, phone, status')
        .eq('town_id', townId);
      for (const c of (coords ?? []) as { id: string; display_name: string | null; phone: string | null; status: string | null }[]) {
        byId.set(c.id, { id: c.id, name: c.display_name?.trim() || 'Unnamed member', phone: c.phone, status: c.status, roles: [] });
      }
    } catch { /* town_read policy governs; degrade quietly */ }

    try {
      const { data: roles } = await supabase
        .from('role_assignments')
        .select('user_id, role_key')
        .eq('town_id', townId);
      for (const r of (roles ?? []) as { user_id: string; role_key: string }[]) {
        const p = byId.get(r.user_id) ?? { id: r.user_id, name: 'Unnamed member', phone: null, status: null, roles: [] };
        if (!p.roles.includes(r.role_key)) p.roles.push(r.role_key);
        byId.set(r.user_id, p);
      }
    } catch { /* ignore */ }

    setPeople(Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  }, [townId]);

  useEffect(() => { if (!actorLoading) load(); }, [actorLoading, load]);

  if (!actorLoading && signedIn === false) {
    return (
      <div style={{ padding: '48px 16px', textAlign: 'center' }}>
        <Users size={44} color="var(--color-ubuntu-orange)" />
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', margin: '16px 0 8px' }}>My People</h1>
        <p style={{ fontSize: 14, color: 'var(--muted-foreground)', marginBottom: 20 }}>Sign in to see your town team.</p>
        <Link href="/login?next=/workspace/people" style={{ background: 'var(--color-ubuntu-orange)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Sign in</Link>
      </div>
    );
  }

  const rolesPresent = Array.from(new Set(people.flatMap(p => p.roles)));
  const filters = ['all', ...rolesPresent];
  const shown = filter === 'all' ? people : people.filter(p => p.roles.includes(filter));

  return (
    <div>
      <div style={{ padding: '6px 2px 14px' }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--foreground)', margin: 0, letterSpacing: '-0.02em' }}>My People</h1>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: '4px 0 0' }}>
          {loading ? 'Loading…' : `${people.length} ${people.length === 1 ? 'person' : 'people'}${town ? ` in ${town.name}` : ''}`}
        </p>
      </div>

      {/* Filter chips */}
      {filters.length > 1 && (
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 12, marginBottom: 4 }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              flex: 'none', padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer',
              border: filter === f ? '1px solid var(--color-ubuntu-purple)' : '1px solid var(--border)',
              background: filter === f ? 'var(--color-ubuntu-purple)' : 'var(--card)',
              color: filter === f ? '#fff' : 'var(--muted-foreground)',
            }}>{f === 'all' ? 'All' : (ROLE_LABEL[f] ?? f)}</button>
          ))}
        </div>
      )}

      {/* People list */}
      {loading ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 20, color: 'var(--muted-foreground)', fontSize: 14 }}>Loading…</div>
      ) : shown.length === 0 ? (
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 32, textAlign: 'center' }}>
          <Users size={30} color="var(--muted-foreground)" />
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--foreground)', margin: '12px 0 4px' }}>No people yet</p>
          <p style={{ fontSize: 13, color: 'var(--muted-foreground)', margin: 0 }}>Invite your first team member to get started.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {shown.map(p => (
            <div key={p.id} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ flex: 'none', width: 44, height: 44, borderRadius: '50%', background: 'var(--secondary)', color: 'var(--color-ubuntu-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontSize: 15, fontWeight: 700, color: 'var(--foreground)' }}>{p.name}</span>
                <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                  {p.roles.length ? p.roles.map(r => (
                    <span key={r} style={{ fontSize: 10.5, fontWeight: 700, background: 'var(--secondary)', color: 'var(--muted-foreground)', padding: '2px 7px', borderRadius: 6 }}>{ROLE_LABEL[r] ?? r}</span>
                  )) : <span style={{ fontSize: 11.5, color: 'var(--muted-foreground)' }}>Team member</span>}
                </span>
              </span>
              {p.phone && (
                <a href={`tel:${p.phone}`} aria-label={`Call ${p.name}`} style={{ flex: 'none', width: 40, height: 40, borderRadius: 10, background: 'var(--secondary)', color: 'var(--color-ubuntu-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <Phone size={18} />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Invite (coming soon) */}
      <div style={{ marginTop: 16, background: 'var(--card)', border: '1px dashed var(--border)', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ flex: 'none', width: 40, height: 40, borderRadius: 10, background: 'var(--secondary)', color: 'var(--color-ubuntu-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><UserPlus size={19} /></span>
        <span style={{ flex: 1 }}>
          <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: 'var(--foreground)' }}>Invite a person</span>
          <span style={{ display: 'block', fontSize: 12, color: 'var(--muted-foreground)' }}>Bring someone into an initiative in your town.</span>
        </span>
        <span style={{ flex: 'none', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', background: 'var(--secondary)', color: 'var(--muted-foreground)', padding: '4px 8px', borderRadius: 8 }}>Soon</span>
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--muted-foreground)', textAlign: 'center', margin: '14px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
        <ShieldCheck size={13} /> You only see people in towns you coordinate.
      </p>
    </div>
  );
}
