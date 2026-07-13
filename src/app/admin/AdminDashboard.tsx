'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';

// ============================================================================
// Types
// ============================================================================

interface Overview {
  coordinators: number;
  towns_live: number;
  total_work: number;
  published: number;
  pending_review: number;
  active_coordinators: number;
  not_started: number;
  outbox_pending: number;
}

interface TownRow {
  town_name: string;
  town_slug: string;
  town_id: string;
  coordinators: number;
  entries: number;
  published: number;
}

interface CoordinatorRow {
  coordinator_id: string;
  coordinator_name: string;
  town_name: string | null;
  town_slug: string | null;
  band: string | null;
  coord_status: string;
  entries: number;
  published: number;
  last_activity: string | null;
}

interface TypeRow {
  work_type: string;
  total: number;
  published: number;
}

interface RecentRow {
  created_at: string;
  coordinator: string | null;
  town_name: string | null;
  work_type: string;
  title: string;
  cw_status: string;
  visibility: string;
}

// ============================================================================
// Status colors
// ============================================================================

const STATUS_BADGE: Record<string, { bg: string; fg: string }> = {
  draft: { bg: '#F3F4F6', fg: '#4B5563' },
  submitted: { bg: '#DBEAFE', fg: '#1D4ED8' },
  in_review: { bg: '#FEF3C7', fg: '#B45309' },
  approved: { bg: '#D1FAE5', fg: '#047857' },
  published: { bg: '#A7F3D0', fg: '#065F46' },
  rejected: { bg: '#FEE2E2', fg: '#DC2626' },
  returned: { bg: '#FFEDD5', fg: '#C2410C' },
};

const TYPE_LABELS: Record<string, string> = {
  fixeasy_worker: '🔧 Worker',
  familyhouse: '🏠 Host',
  business: '🛒 Business',
  event: '🎉 Event',
  podcast: '🎙️ Podcast',
};

// ============================================================================
// Component
// ============================================================================

export default function AdminDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [towns, setTowns] = useState<TownRow[]>([]);
  const [coordinators, setCoordinators] = useState<CoordinatorRow[]>([]);
  const [types, setTypes] = useState<TypeRow[]>([]);
  const [recent, setRecent] = useState<RecentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'coordinator_name' | 'town_name' | 'entries' | 'published' | 'last_activity'>('entries');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const fetchAll = useCallback(async () => {
    const [ovRes, twRes, coRes, tyRes, reRes] = await Promise.all([
      supabase.rpc('hq_overview'),
      supabase.rpc('hq_town_rollup'),
      supabase.rpc('hq_coordinators'),
      supabase.rpc('hq_type_breakdown'),
      supabase.rpc('hq_recent', { _limit: 50 }),
    ]);

    if (ovRes.data && ovRes.data.length > 0) setOverview(ovRes.data[0]);
    if (twRes.data) setTowns(twRes.data);
    if (coRes.data) setCoordinators(coRes.data);
    if (tyRes.data) setTypes(tyRes.data);
    if (reRes.data) setRecent(reRes.data);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 45000); // Poll every 45s
    return () => clearInterval(interval);
  }, [fetchAll]);

  // Filtered + sorted coordinators
  const filteredCoordinators = useMemo(() => {
    let list = coordinators;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        (c.coordinator_name || '').toLowerCase().includes(q) ||
        (c.town_name || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let av: string | number | null = a[sortField];
      let bv: string | number | null = b[sortField];
      if (sortField === 'last_activity') {
        av = av ? new Date(av).getTime() : 0;
        bv = bv ? new Date(bv).getTime() : 0;
      }
      if (av == null) av = '';
      if (bv == null) bv = '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [coordinators, search, sortField, sortDir]);

  // Inactive coordinators (0 entries)
  const inactive = useMemo(() => coordinators.filter(c => c.entries === 0), [coordinators]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #EEB849', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#94A3B8' }}>Loading HQ Command Center...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0F172A', color: '#E2E8F0' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1E293B', padding: '16px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>
              🏢 HQ Bootcamp Command Center
            </h1>
            <p style={{ fontSize: 12, color: '#64748B', margin: '4px 0 0' }}>
              Ubuntu Town · Founding Cohort · Real-time operations view
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#64748B' }}>
              Last refresh: {lastRefresh.toLocaleTimeString('en-ZA')}
            </span>
            <button onClick={() => { setLoading(true); fetchAll(); }} style={{ background: '#1E293B', color: '#E2E8F0', border: '1px solid #334155', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px' }}>
        {/* KPI Cards */}
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="Coordinators" value={overview.coordinators} color="#EEB849" sub="in bootcamp" />
            <KpiCard label="Towns Live" value={overview.towns_live} color="#10B981" sub="with coordinator" />
            <KpiCard label="Community Work" value={overview.total_work} color="#8B5CF6" sub={`${overview.published} published`} />
            <KpiCard label="Active" value={overview.active_coordinators} color="#3B82F6" sub={`${overview.not_started} not started`} />
          </div>
        )}

        {/* Secondary KPIs */}
        {overview && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            <KpiCard label="Pending Review" value={overview.pending_review} color="#F59E0B" sub="submitted + in_review" />
            <KpiCard label="Published" value={overview.published} color="#059669" sub="live on town pages" />
            <KpiCard label="Outbox Pending" value={overview.outbox_pending} color="#EF4444" sub={overview.outbox_pending > 0 ? 'needs attention' : 'all clear'} />
          </div>
        )}

        {/* Type Breakdown */}
        {types.length > 0 && (
          <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: '0 0 16px' }}>📊 Work Type Breakdown</h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {types.map(t => (
                <div key={t.work_type} style={{ background: '#0F172A', borderRadius: 10, padding: '12px 20px', border: '1px solid #334155', minWidth: 140 }}>
                  <p style={{ fontSize: 13, color: '#94A3B8', margin: '0 0 4px' }}>{TYPE_LABELS[t.work_type] || t.work_type}</p>
                  <p style={{ fontSize: 24, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>{t.total}</p>
                  <p style={{ fontSize: 11, color: '#10B981', margin: '2px 0 0' }}>{t.published} published</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* National Scoreboard — Town Rollup */}
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: '0 0 16px' }}>🏘️ Towns at a Glance</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>Town</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>Coords</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>Entries</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>Published</th>
                  <th style={{ textAlign: 'left', padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>Activity</th>
                </tr>
              </thead>
              <tbody>
                {towns.map(t => (
                  <tr key={t.town_id} style={{ borderBottom: '1px solid #1E293B' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <a href={`/town/${t.town_slug}`} style={{ color: '#EEB849', textDecoration: 'none', fontWeight: 600 }}>{t.town_name}</a>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#E2E8F0' }}>{t.coordinators}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#E2E8F0' }}>{t.entries}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#10B981' }}>{t.published}</td>
                    <td style={{ padding: '8px 12px' }}>
                      <div style={{ background: '#334155', borderRadius: 4, height: 6, width: '100%' }}>
                        <div style={{ background: t.entries > 0 ? '#10B981' : '#EF4444', borderRadius: 4, height: 6, width: `${Math.min(100, (t.entries / Math.max(1, Math.max(...towns.map(x => x.entries)))) * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Coordinator Roster */}
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: 0 }}>👥 Coordinator Roster</h2>
            <input
              type="text" placeholder="Search name or town..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: '#0F172A', border: '1px solid #334155', borderRadius: 8, padding: '8px 14px', color: '#E2E8F0', fontSize: 13, width: 240 }}
            />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #334155' }}>
                  <Th label="Name" field="coordinator_name" current={sortField} dir={sortDir} onClick={toggleSort} />
                  <Th label="Town" field="town_name" current={sortField} dir={sortDir} onClick={toggleSort} />
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>Band</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', color: '#94A3B8', fontWeight: 600 }}>Status</th>
                  <Th label="Entries" field="entries" current={sortField} dir={sortDir} onClick={toggleSort} />
                  <Th label="Published" field="published" current={sortField} dir={sortDir} onClick={toggleSort} />
                  <Th label="Last Activity" field="last_activity" current={sortField} dir={sortDir} onClick={toggleSort} />
                </tr>
              </thead>
              <tbody>
                {filteredCoordinators.map(c => (
                  <tr key={c.coordinator_id} style={{ borderBottom: '1px solid #1E293B', background: c.entries === 0 ? '#1C1917' : 'transparent' }}>
                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#F8FAFC' }}>{c.coordinator_name || '—'}</td>
                    <td style={{ padding: '8px 12px' }}>
                      {c.town_slug ? (
                        <a href={`/town/${c.town_slug}`} style={{ color: '#EEB849', textDecoration: 'none' }}>{c.town_name}</a>
                      ) : <span style={{ color: '#64748B' }}>Unassigned</span>}
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#94A3B8' }}>{c.band || '—'}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px' }}>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: c.coord_status === 'active' ? '#065F46' : '#78350F', color: c.coord_status === 'active' ? '#A7F3D0' : '#FDE68A' }}>
                        {c.coord_status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#E2E8F0', fontWeight: c.entries > 0 ? 700 : 400 }}>{c.entries}</td>
                    <td style={{ textAlign: 'center', padding: '8px 12px', color: '#10B981' }}>{c.published}</td>
                    <td style={{ padding: '8px 12px', color: '#94A3B8', fontSize: 12 }}>
                      {c.last_activity ? new Date(c.last_activity).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: '#64748B', margin: '12px 0 0' }}>
            Showing {filteredCoordinators.length} of {coordinators.length} coordinators
          </p>
        </div>

        {/* Inactivity Flag-List */}
        {inactive.length > 0 && (
          <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #7F1D1D' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#FCA5A5', margin: '0 0 4px' }}>🚨 Not Started ({inactive.length})</h2>
            <p style={{ fontSize: 12, color: '#94A3B8', margin: '0 0 16px' }}>Coordinators with zero community work entries — may need a nudge.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
              {inactive.map(c => (
                <div key={c.coordinator_id} style={{ background: '#0F172A', borderRadius: 8, padding: '10px 14px', border: '1px solid #7F1D1D' }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#FCA5A5', margin: 0 }}>{c.coordinator_name || '—'}</p>
                  <p style={{ fontSize: 11, color: '#64748B', margin: '2px 0 0' }}>{c.town_name || 'No town'}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* How to Assist */}
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: '0 0 12px' }}>📋 How to Assist</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            <AssistCard title="Not Started" desc="WhatsApp them directly. Ask what's blocking them. Often it's just confusion about the form." color="#EF4444" count={overview?.not_started || 0} />
            <AssistCard title="Pending Review" desc="Review and approve their submissions. Quick approvals keep momentum." color="#F59E0B" count={overview?.pending_review || 0} />
            <AssistCard title="Outbox Stuck" desc="Check the outbox worker. If rows are stuck, the worker may need a restart." color="#8B5CF6" count={overview?.outbox_pending || 0} />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div style={{ background: '#1E293B', borderRadius: 12, padding: 20, marginBottom: 24, border: '1px solid #334155' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: '0 0 16px' }}>🕐 Recent Activity</h2>
          {recent.length === 0 ? (
            <p style={{ color: '#64748B', fontSize: 13 }}>No community work submitted yet.</p>
          ) : (
            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
              {recent.map((r, i) => {
                const badge = STATUS_BADGE[r.cw_status] || STATUS_BADGE.draft;
                return (
                  <div key={i} style={{ padding: '10px 0', borderBottom: '1px solid #0F172A', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 12, color: '#64748B', minWidth: 70, flexShrink: 0 }}>
                      {new Date(r.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' })}
                    </span>
                    <span style={{ fontSize: 12, color: '#94A3B8', minWidth: 100, flexShrink: 0 }}>{TYPE_LABELS[r.work_type] || r.work_type}</span>
                    <span style={{ fontSize: 13, color: '#F8FAFC', flex: 1 }}>{r.title}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', minWidth: 80 }}>{r.coordinator || '—'}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', minWidth: 80 }}>{r.town_name || '—'}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: badge.bg, color: badge.fg }}>{r.cw_status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function KpiCard({ label, value, color, sub }: { label: string; value: number; color: string; sub: string }) {
  return (
    <div style={{ background: '#1E293B', borderRadius: 12, padding: 16, border: '1px solid #334155' }}>
      <p style={{ fontSize: 11, color: '#94A3B8', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</p>
      <p style={{ fontSize: 32, fontWeight: 700, color, margin: 0 }}>{value}</p>
      <p style={{ fontSize: 11, color: '#64748B', margin: '4px 0 0' }}>{sub}</p>
    </div>
  );
}

function Th({ label, field, current, dir, onClick }: { label: string; field: string; current: string; dir: string; onClick: (f: any) => void }) {
  const active = current === field;
  return (
    <th onClick={() => onClick(field)} style={{ textAlign: 'left', padding: '8px 12px', color: active ? '#EEB849' : '#94A3B8', fontWeight: 600, cursor: 'pointer', userSelect: 'none' }}>
      {label} {active ? (dir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );
}

function AssistCard({ title, desc, color, count }: { title: string; desc: string; color: string; count: number }) {
  return (
    <div style={{ background: '#0F172A', borderRadius: 10, padding: 16, border: `1px solid ${color}30` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color, margin: 0 }}>{title}</h3>
        <span style={{ fontSize: 20, fontWeight: 700, color }}>{count}</span>
      </div>
      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>{desc}</p>
    </div>
  );
}
