'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';

export const runtime = 'edge';



type Status = 'pending' | 'reviewing' | 'shortlisted' | 'accepted' | 'rejected';
type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'non-technical';

interface Application {
  id: string;
  full_name: string;
  email: string;
  whatsapp: string | null;
  town_slug: string;
  location: string;
  town_connection: string;
  town_challenge: string;
  build_idea: string;
  skill_level: SkillLevel;
  total_score: number | null;
  status: Status;
  created_at: string;
  province?: string;
}

const PROVINCES_LIST = [
  'Free State',
  'KwaZulu-Natal',
  'Gauteng',
  'Mpumalanga',
  'Eastern Cape',
  'Limpopo',
  'Northern Cape',
  'North West',
  'Western Cape',
];

const PROVINCE_TOWNS: Record<string, string[]> = {
  'Free State': ['bethlehem','bloemfontein','botshabelo','ficksburg','harrismith','kroonstad','ladybrand','phuthaditjhaba','senekal','welkom'],
  'KwaZulu-Natal': ['durban','greytown','harding','kokstad','newcastle','nquthu','pietermaritzburg','richards-bay'],
  'Gauteng': ['carletonville','ekurhuleni','johannesburg','kempton-park','pretoria','vanderbijlpark'],
  'Mpumalanga': ['acornhoek','bushbuckridge','emalahleni','nelspruit','sabie','witbank'],
  'Eastern Cape': ['east-london','gqeberha','matatiele','mthatha'],
  'Limpopo': ['burgersfort','mokopane','polokwane','thohoyandou'],
  'Northern Cape': ['de-aar','kimberley','springbok','upington'],
  'North West': ['brits','klerksdorp','mafikeng','rustenburg'],
  'Western Cape': ['cape-town','george','paarl','stellenbosch'],
};

function getProvince(townSlug: string): string {
  for (const [province, towns] of Object.entries(PROVINCE_TOWNS)) {
    if (towns.includes(townSlug)) return province;
  }
  return 'Unknown';
}

const STATUS_COLORS: Record<Status, string> = {
  pending: '#94a3b8',
  reviewing: '#60a5fa',
  shortlisted: '#eeb849',
  accepted: '#4ade80',
  rejected: '#f87171',
};

const STATUS_BG: Record<Status, string> = {
  pending: 'rgba(148,163,184,0.12)',
  reviewing: 'rgba(96,165,250,0.12)',
  shortlisted: 'rgba(238,184,73,0.12)',
  accepted: 'rgba(74,222,128,0.12)',
  rejected: 'rgba(248,113,113,0.12)',
};

const STATUS_LIST: Status[] = ['pending', 'reviewing', 'shortlisted', 'accepted', 'rejected'];

function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export default function FellowshipAdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinceFilter, setProvinceFilter] = useState<string>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [openStatusId, setOpenStatusId] = useState<string | null>(null);
  const [modalApp, setModalApp] = useState<Application | null>(null);

  // Auth check
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setAuthed(true);
      } else {
        setAuthed(false);
      }
    });
  }, []);

  // Fetch applications
  const fetchApps = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('builder_applications')
      .select('*')
      .order('total_score', { ascending: false, nullsFirst: false });
    if (!error && data) {
      const enriched = (data as Application[]).map(a => ({
        ...a,
        province: getProvince(a.town_slug),
      }));
      setApps(enriched);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authed) fetchApps();
  }, [authed, fetchApps]);

  async function updateStatus(id: string, status: Status) {
    setUpdatingId(id);
    const { error } = await supabase
      .from('builder_applications')
      .update({ status })
      .eq('id', id);
    if (!error) {
      setApps(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
    setUpdatingId(null);
    setOpenStatusId(null);
  }

  // Summary counts
  const totalApps = apps.length;
  const pendingCount = apps.filter(a => a.status === 'pending').length;
  const shortlistedCount = apps.filter(a => a.status === 'shortlisted').length;
  const acceptedCount = apps.filter(a => a.status === 'accepted').length;
  const reviewingCount = apps.filter(a => a.status === 'reviewing').length;
  const rejectedCount = apps.filter(a => a.status === 'rejected').length;

  const filteredApps = provinceFilter === 'All'
    ? apps
    : apps.filter(a => a.province === provinceFilter);

  // Close status dropdown when clicking outside
  useEffect(() => {
    if (!openStatusId) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-status-dropdown]')) {
        setOpenStatusId(null);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openStatusId]);

  // ---- NOT AUTHED ----
  if (authed === false) {
    return (
      <>
        <style>{`
          :root { --dark: #070509; --purple: #7649bc; --gold: #eeb849; }
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { background: var(--dark); color: #e8e0f5; font-family: 'Inter', system-ui, sans-serif; }
          .auth-wrapper {
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            padding: 2rem;
          }
          .auth-card {
            background: rgba(118,73,188,0.1); border: 1px solid rgba(118,73,188,0.35);
            border-radius: 20px; padding: 3rem 2.5rem; text-align: center; max-width: 420px; width: 100%;
          }
          .auth-icon { font-size: 3rem; margin-bottom: 1.25rem; }
          .auth-title { font-size: 1.4rem; font-weight: 800; color: #fff; margin-bottom: 0.5rem; }
          .auth-sub { color: #a898cc; font-size: 0.9rem; margin-bottom: 2rem; line-height: 1.5; }
          .auth-btn {
            display: inline-block; background: var(--purple); color: #fff;
            text-decoration: none; border-radius: 10px; padding: 0.75rem 2rem;
            font-weight: 700; font-size: 0.95rem; transition: background 0.2s;
          }
          .auth-btn:hover { background: #8f5ed4; }
        `}</style>
        <div className="auth-wrapper">
          <div className="auth-card">
            <div className="auth-icon">🔒</div>
            <div className="auth-title">Sign In Required</div>
            <p className="auth-sub">
              This admin dashboard is protected. Please sign in with an authorised Ubuntu Town account to continue.
            </p>
            <a href="/login?next=/admin/fellowship" className="auth-btn">
              Sign In
            </a>
          </div>
        </div>
      </>
    );
  }

  // ---- LOADING AUTH ----
  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', background: '#070509', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7649bc', fontSize: '1rem' }}>
        Checking authentication…
      </div>
    );
  }

  // ---- ADMIN DASHBOARD ----
  return (
    <>
      <style>{`
        :root { --dark: #070509; --purple: #7649bc; --gold: #eeb849; --orange: #f5a340; }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        body { background: var(--dark); color: #e8e0f5; font-family: 'Inter', system-ui, sans-serif; }

        .admin-layout { min-height: 100vh; background: var(--dark); }

        /* TOPBAR */
        .topbar {
          background: rgba(7,5,9,0.97); border-bottom: 1px solid rgba(118,73,188,0.3);
          padding: 0.875rem 1.75rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;
          position: sticky; top: 0; z-index: 50;
        }
        .topbar-title { font-weight: 800; font-size: 1.05rem; color: #fff; }
        .topbar-sub { font-size: 0.72rem; color: var(--gold); letter-spacing: 0.08em; text-transform: uppercase; }
        .topbar-right { display: flex; align-items: center; gap: 0.75rem; }
        .refresh-btn {
          background: rgba(118,73,188,0.2); border: 1px solid rgba(118,73,188,0.4);
          color: #c4b8e0; border-radius: 8px; padding: 0.4rem 0.9rem;
          font-size: 0.82rem; font-weight: 600; cursor: pointer;
          font-family: inherit; transition: background 0.2s;
        }
        .refresh-btn:hover { background: rgba(118,73,188,0.35); }

        /* SUMMARY */
        .summary-strip {
          display: flex; flex-wrap: wrap; gap: 1rem;
          padding: 1.5rem 1.75rem;
        }
        .summary-card {
          flex: 1; min-width: 120px; max-width: 180px;
          background: rgba(255,255,255,0.04); border: 1px solid rgba(118,73,188,0.2);
          border-radius: 12px; padding: 1rem 1.25rem; text-align: center;
        }
        .summary-num { font-size: 2rem; font-weight: 900; line-height: 1; }
        .summary-label { font-size: 0.72rem; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: #a898cc; margin-top: 0.25rem; }

        /* FILTER BAR */
        .filter-bar {
          display: flex; flex-wrap: wrap; gap: 0.5rem;
          padding: 0 1.75rem 1.25rem;
        }
        .filter-btn {
          background: rgba(255,255,255,0.05); border: 1px solid rgba(118,73,188,0.25);
          color: #c4b8e0; border-radius: 8px; padding: 0.35rem 0.85rem;
          font-size: 0.8rem; font-weight: 600; cursor: pointer; font-family: inherit;
          transition: all 0.15s;
        }
        .filter-btn:hover { border-color: var(--purple); color: #fff; }
        .filter-btn.active { background: var(--purple); border-color: var(--purple); color: #fff; }

        /* TABLE */
        .table-wrapper {
          overflow-x: auto; padding: 0 1.75rem 3rem;
        }
        .apps-table {
          width: 100%; border-collapse: collapse;
          font-size: 0.85rem; min-width: 900px;
        }
        .apps-table thead th {
          background: rgba(118,73,188,0.18); color: var(--gold);
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
          padding: 0.65rem 0.85rem; text-align: left; border-bottom: 2px solid rgba(118,73,188,0.3);
          white-space: nowrap;
        }
        .apps-table tbody tr {
          border-bottom: 1px solid rgba(118,73,188,0.12);
          transition: background 0.15s;
        }
        .apps-table tbody tr:hover { background: rgba(118,73,188,0.07); }
        .apps-table tbody td {
          padding: 0.7rem 0.85rem; vertical-align: middle;
          color: #d4c8ee;
        }
        .td-name { font-weight: 700; color: #fff; white-space: nowrap; }
        .td-email { color: #a898cc; font-size: 0.8rem; }
        .td-whatsapp { color: #a898cc; font-size: 0.8rem; white-space: nowrap; }
        .td-town { white-space: nowrap; }
        .td-town-name { font-weight: 600; color: #fff; }
        .td-province { font-size: 0.75rem; color: #a898cc; }
        .td-truncate { max-width: 180px; color: #c4b8e0; font-size: 0.82rem; }
        .td-score {
          font-weight: 800; font-size: 1rem; text-align: center;
          color: var(--gold);
        }
        .td-score.null { color: #4a3d6b; }

        /* SKILL BADGE */
        .skill-badge {
          display: inline-block; font-size: 0.72rem; font-weight: 700;
          padding: 0.2rem 0.55rem; border-radius: 6px; white-space: nowrap;
          text-transform: capitalize;
        }

        /* STATUS */
        .status-cell { position: relative; }
        .status-pill {
          display: inline-flex; align-items: center; gap: 0.35rem;
          font-size: 0.75rem; font-weight: 700; text-transform: capitalize;
          padding: 0.28rem 0.65rem; border-radius: 8px; cursor: pointer;
          border: 1px solid transparent; white-space: nowrap;
          transition: opacity 0.15s;
        }
        .status-pill:hover { opacity: 0.85; }
        .status-pill svg { width: 10px; height: 10px; }
        .status-dropdown {
          position: absolute; top: calc(100% + 4px); left: 0; z-index: 30;
          background: #1a1030; border: 1px solid rgba(118,73,188,0.5);
          border-radius: 10px; overflow: hidden; min-width: 130px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .status-option {
          display: block; padding: 0.55rem 0.85rem; font-size: 0.8rem; font-weight: 600;
          color: #c4b8e0; cursor: pointer; text-transform: capitalize;
          transition: background 0.1s;
        }
        .status-option:hover { background: rgba(118,73,188,0.25); }
        .status-option.current { color: #fff; font-weight: 800; }

        /* VIEW BUTTON */
        .view-btn {
          background: rgba(118,73,188,0.2); border: 1px solid rgba(118,73,188,0.35);
          color: #c4b8e0; border-radius: 7px; padding: 0.3rem 0.65rem;
          font-size: 0.75rem; font-weight: 600; cursor: pointer; font-family: inherit;
          white-space: nowrap; transition: background 0.15s;
        }
        .view-btn:hover { background: rgba(118,73,188,0.4); color: #fff; }

        /* EMPTY */
        .empty-state {
          text-align: center; padding: 4rem 2rem; color: #4a3d6b;
          font-size: 0.95rem;
        }

        /* LOADING */
        .loading-state {
          text-align: center; padding: 4rem 2rem; color: var(--purple);
        }

        /* MODAL */
        .modal-backdrop {
          position: fixed; inset: 0; background: rgba(7,5,9,0.85);
          z-index: 100; display: flex; align-items: center; justify-content: center;
          padding: 1.5rem;
        }
        .modal-card {
          background: #0f0b1a; border: 1px solid rgba(118,73,188,0.4);
          border-radius: 20px; padding: 2rem; max-width: 620px; width: 100%;
          max-height: 85vh; overflow-y: auto; position: relative;
        }
        .modal-close {
          position: absolute; top: 1rem; right: 1rem;
          background: rgba(255,255,255,0.07); border: none; border-radius: 8px;
          color: #a898cc; width: 32px; height: 32px; cursor: pointer;
          font-size: 1rem; font-family: inherit; display: flex; align-items: center; justify-content: center;
        }
        .modal-close:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .modal-name { font-size: 1.3rem; font-weight: 800; color: #fff; margin-bottom: 0.25rem; }
        .modal-meta { color: #a898cc; font-size: 0.85rem; margin-bottom: 1.5rem; }
        .modal-section { margin-bottom: 1.25rem; }
        .modal-section-title {
          font-size: 0.72rem; font-weight: 700; letter-spacing: 0.1em;
          text-transform: uppercase; color: var(--gold); margin-bottom: 0.4rem;
        }
        .modal-section-body { color: #c4b8e0; font-size: 0.9rem; line-height: 1.6; }
        .modal-divider { border: none; border-top: 1px solid rgba(118,73,188,0.2); margin: 1.25rem 0; }
        .modal-row { display: flex; gap: 1.5rem; flex-wrap: wrap; margin-bottom: 1rem; }
        .modal-field { flex: 1; min-width: 160px; }
        .modal-field-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #7649bc; margin-bottom: 0.2rem; }
        .modal-field-val { font-size: 0.9rem; color: #e8e0f5; }
      `}</style>

      <div className="admin-layout">
        {/* TOPBAR */}
        <div className="topbar">
          <div>
            <div className="topbar-title">Ubuntu Build Fellowship</div>
            <div className="topbar-sub">Applications Dashboard</div>
          </div>
          <div className="topbar-right">
            <button
              className="refresh-btn"
              onClick={fetchApps}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* SUMMARY */}
        <div className="summary-strip">
          <div className="summary-card">
            <div className="summary-num" style={{ color: '#fff' }}>{totalApps}</div>
            <div className="summary-label">Total</div>
          </div>
          <div className="summary-card">
            <div className="summary-num" style={{ color: STATUS_COLORS.pending }}>{pendingCount}</div>
            <div className="summary-label">Pending</div>
          </div>
          <div className="summary-card">
            <div className="summary-num" style={{ color: STATUS_COLORS.reviewing }}>{reviewingCount}</div>
            <div className="summary-label">Reviewing</div>
          </div>
          <div className="summary-card">
            <div className="summary-num" style={{ color: STATUS_COLORS.shortlisted }}>{shortlistedCount}</div>
            <div className="summary-label">Shortlisted</div>
          </div>
          <div className="summary-card">
            <div className="summary-num" style={{ color: STATUS_COLORS.accepted }}>{acceptedCount}</div>
            <div className="summary-label">Accepted</div>
          </div>
          <div className="summary-card">
            <div className="summary-num" style={{ color: STATUS_COLORS.rejected }}>{rejectedCount}</div>
            <div className="summary-label">Rejected</div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="filter-bar">
          {['All', ...PROVINCES_LIST].map(p => (
            <button
              key={p}
              className={`filter-btn${provinceFilter === p ? ' active' : ''}`}
              onClick={() => setProvinceFilter(p)}
            >
              {p}
            </button>
          ))}
        </div>

        {/* TABLE */}
        <div className="table-wrapper">
          {loading ? (
            <div className="loading-state">Loading applications…</div>
          ) : filteredApps.length === 0 ? (
            <div className="empty-state">
              {provinceFilter === 'All'
                ? 'No applications yet.'
                : `No applications for ${provinceFilter} yet.`}
            </div>
          ) : (
            <table className="apps-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>WhatsApp</th>
                  <th>Town</th>
                  <th>Connection</th>
                  <th>Challenge</th>
                  <th>Build Idea</th>
                  <th>Skill</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map(app => (
                  <tr key={app.id}>
                    {/* NAME */}
                    <td className="td-name">{app.full_name}</td>

                    {/* EMAIL */}
                    <td className="td-email">
                      <a href={`mailto:${app.email}`} style={{ color: '#a898cc', textDecoration: 'none' }}>
                        {app.email}
                      </a>
                    </td>

                    {/* WHATSAPP */}
                    <td className="td-whatsapp">{app.whatsapp ?? '—'}</td>

                    {/* TOWN */}
                    <td className="td-town">
                      <div className="td-town-name">{app.location || app.town_slug}</div>
                      <div className="td-province">{app.province}</div>
                    </td>

                    {/* CONNECTION */}
                    <td className="td-truncate">{truncate(app.town_connection, 60)}</td>

                    {/* CHALLENGE */}
                    <td className="td-truncate">{truncate(app.town_challenge, 80)}</td>

                    {/* BUILD IDEA */}
                    <td className="td-truncate">{truncate(app.build_idea, 80)}</td>

                    {/* SKILL */}
                    <td>
                      <span
                        className="skill-badge"
                        style={{
                          background:
                            app.skill_level === 'advanced' ? 'rgba(74,222,128,0.15)' :
                            app.skill_level === 'intermediate' ? 'rgba(96,165,250,0.15)' :
                            app.skill_level === 'beginner' ? 'rgba(238,184,73,0.15)' :
                            'rgba(148,163,184,0.15)',
                          color:
                            app.skill_level === 'advanced' ? '#4ade80' :
                            app.skill_level === 'intermediate' ? '#60a5fa' :
                            app.skill_level === 'beginner' ? '#eeb849' :
                            '#94a3b8',
                        }}
                      >
                        {app.skill_level}
                      </span>
                    </td>

                    {/* SCORE */}
                    <td className={`td-score${app.total_score == null ? ' null' : ''}`}>
                      {app.total_score != null ? app.total_score : '—'}
                    </td>

                    {/* STATUS */}
                    <td className="status-cell" data-status-dropdown>
                      <div
                        className="status-pill"
                        style={{
                          background: STATUS_BG[app.status],
                          color: STATUS_COLORS[app.status],
                          border: `1px solid ${STATUS_COLORS[app.status]}40`,
                        }}
                        onClick={() => setOpenStatusId(openStatusId === app.id ? null : app.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setOpenStatusId(openStatusId === app.id ? null : app.id); }}
                        aria-haspopup="listbox"
                        aria-expanded={openStatusId === app.id}
                      >
                        {updatingId === app.id ? 'Saving…' : app.status}
                        <svg viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M1 1l4 4 4-4" />
                        </svg>
                      </div>

                      {openStatusId === app.id && (
                        <div className="status-dropdown" role="listbox">
                          {STATUS_LIST.map(s => (
                            <div
                              key={s}
                              className={`status-option${app.status === s ? ' current' : ''}`}
                              style={{ color: STATUS_COLORS[s] }}
                              role="option"
                              aria-selected={app.status === s}
                              onClick={() => updateStatus(app.id, s)}
                              onKeyDown={e => { if (e.key === 'Enter') updateStatus(app.id, s); }}
                              tabIndex={0}
                            >
                              {s}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* VIEW */}
                    <td>
                      <button
                        className="view-btn"
                        onClick={() => setModalApp(app)}
                      >
                        View Full
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modalApp && (
        <div
          className="modal-backdrop"
          onClick={e => { if (e.target === e.currentTarget) setModalApp(null); }}
          role="dialog"
          aria-modal="true"
          aria-label={`Application details for ${modalApp.full_name}`}
        >
          <div className="modal-card">
            <button className="modal-close" onClick={() => setModalApp(null)} aria-label="Close">✕</button>

            <div className="modal-name">{modalApp.full_name}</div>
            <div className="modal-meta">
              {modalApp.email}
              {modalApp.whatsapp ? ` · ${modalApp.whatsapp}` : ''}
              {' · '}
              {new Date(modalApp.created_at).toLocaleDateString('en-ZA', { dateStyle: 'medium' })}
            </div>

            <div className="modal-row">
              <div className="modal-field">
                <div className="modal-field-label">Town</div>
                <div className="modal-field-val">{modalApp.location || modalApp.town_slug}</div>
              </div>
              <div className="modal-field">
                <div className="modal-field-label">Province</div>
                <div className="modal-field-val">{modalApp.province}</div>
              </div>
              <div className="modal-field">
                <div className="modal-field-label">Skill Level</div>
                <div className="modal-field-val" style={{ textTransform: 'capitalize' }}>{modalApp.skill_level}</div>
              </div>
              <div className="modal-field">
                <div className="modal-field-label">Score</div>
                <div className="modal-field-val" style={{ color: '#eeb849', fontWeight: 800 }}>
                  {modalApp.total_score != null ? modalApp.total_score : '—'}
                </div>
              </div>
            </div>

            <hr className="modal-divider" />

            <div className="modal-section">
              <div className="modal-section-title">Town Connection</div>
              <div className="modal-section-body">{modalApp.town_connection}</div>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">Biggest Challenge Facing Their Town</div>
              <div className="modal-section-body">{modalApp.town_challenge}</div>
            </div>

            <div className="modal-section">
              <div className="modal-section-title">What They Want to Build</div>
              <div className="modal-section-body">{modalApp.build_idea}</div>
            </div>

            <hr className="modal-divider" />

            {/* Status changer in modal */}
            <div className="modal-section">
              <div className="modal-section-title">Update Status</div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {STATUS_LIST.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      updateStatus(modalApp.id, s);
                      setModalApp(prev => prev ? { ...prev, status: s } : null);
                    }}
                    style={{
                      background: modalApp.status === s ? STATUS_BG[s] : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${modalApp.status === s ? STATUS_COLORS[s] + '80' : 'rgba(118,73,188,0.2)'}`,
                      color: modalApp.status === s ? STATUS_COLORS[s] : '#a898cc',
                      borderRadius: '8px', padding: '0.35rem 0.85rem',
                      fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                      fontFamily: 'inherit', textTransform: 'capitalize',
                      transition: 'all 0.15s',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
