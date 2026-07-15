'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import {
  MapPin, Plus, FileText, CheckCircle, Clock, Eye, AlertCircle, LogOut,
  MessageCircle, Bell, Radio, Compass, Trophy, Camera, Shield, Activity,
  Inbox, Megaphone, Pin, X, Send, UserPlus, Check,
} from 'lucide-react';

type AuthState = 'loading' | 'not_logged_in' | 'no_role' | 'ready';
type Tab = 'work' | 'inbox' | 'activity' | 'missions' | 'leaderboard';

interface CommunityWork {
  id: string;
  type: string;
  title: string;
  status: string;
  visibility: string;
  created_at: string;
  published_at: string | null;
  photo_verified?: boolean;
  gps_verified?: boolean;
  contact_verified?: boolean;
  verify_count?: number;
}

interface TownInfo { id: string; name: string; slug: string; }
interface PresenceUser { user_id: string; name: string; }
interface ActivityRow { at: string; actor: string; action: string; work_type: string; title: string; status: string; }
interface Notification { id: string; type: string; title: string; body?: string; work_id?: string; read_at?: string; created_at: string; }
interface Mission { key: string; title: string; target: number; done: number; complete: boolean; }
interface Assignment { id: string; work_id: string; title: string; work_type: string; status: string; note?: string; assigned_by: string; created_at: string; completed_at?: string | null; }
interface Announcement { id: string; title: string; body?: string; pinned: boolean; created_at: string; author_id: string; town_id?: string; }

const WORK_TYPE_LABELS: Record<string, string> = {
  daycare: '🧸 Daycare OS', fixeasy_worker: '🔧 FixEasy Worker',
  familyhouse: '🏠 FamilyHouse Host', business: '🛒 Local Business',
  event: '🎉 Community Event', podcast: '🎙️ Inside.Town Podcast',
};

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'work', label: 'Work', icon: FileText },
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'missions', label: 'Missions', icon: Compass },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
];

export default function WorkspacePage() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [user, setUser] = useState<any>(null);
  const [town, setTown] = useState<TownInfo | null>(null);
  const [works, setWorks] = useState<CommunityWork[]>([]);
  const [stats, setStats] = useState({ published: 0, pending: 0, draft: 0, total: 0 });
  const [tab, setTab] = useState<Tab>('work');

  // Realtime & presence
  const [presence, setPresence] = useState<PresenceUser[]>([]);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  // Readiness + missions
  const [readiness, setReadiness] = useState<number>(0);
  const [missions, setMissions] = useState<Mission[]>([]);

  // Inbox + Announcements
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  const reloadWorksAndStats = async (townId: string, roleKey: string) => {
    const q = supabase.from('community_work').select('id,type,title,status,visibility,created_at,published_at,photo_verified,gps_verified,contact_verified,verify_count').order('created_at', { ascending: false });
    if (roleKey === 'coordinator' || roleKey === 'deputy') q.eq('town_id', townId);
    const { data } = await q;
    if (data) {
      setWorks(data);
      setStats({
        published: data.filter(w => w.status === 'published').length,
        pending: data.filter(w => ['submitted', 'in_review', 'approved'].includes(w.status)).length,
        draft: data.filter(w => w.status === 'draft').length,
        total: data.length,
      });
    }
  };

  useEffect(() => {
    let chan: any = null;
    let notifChan: any = null;
    let assignChan: any = null;
    let annChan: any = null;

    (async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { setAuthState('not_logged_in'); return; }
      setUser(u);

      const { data: roles } = await supabase.from('role_assignments').select('town_id, role_key').eq('user_id', u.id).in('role_key', ['coordinator', 'deputy', 'admin', 'ops']).limit(1);
      if (!roles || roles.length === 0) { setAuthState('no_role'); return; }
      const townId = roles[0].town_id;
      const roleKey = roles[0].role_key;

      if (townId) {
        const { data: townData } = await supabase.from('towns').select('id, name, slug').eq('id', townId).single();
        if (townData) setTown(townData);
      }

      await reloadWorksAndStats(townId!, roleKey);

      // Activity feed
      const { data: actData } = await supabase.rpc('town_activity', { _town_id: townId, _limit: 30 });
      if (actData) setActivity(actData as ActivityRow[]);

      // Readiness score
      const { data: rs } = await supabase.rpc('readiness_score', { _town_id: townId });
      if (typeof rs === 'number') setReadiness(rs);

      // Missions
      const { data: mData } = await supabase.rpc('my_missions', { _town_id: townId });
      if (mData) setMissions(mData as Mission[]);

      // Notifications
      const { data: nData } = await supabase.from('notifications').select('*').is('read_at', null).order('created_at', { ascending: false }).limit(20);
      if (nData) { setNotifs(nData); setUnreadNotifs(nData.length); }

      // Assignments
      const { data: aData } = await supabase.rpc('my_assignments');
      if (aData) setAssignments(aData as Assignment[]);

      // Announcements — town + national (town_id is null)
      const { data: annData } = await supabase
        .from('announcements')
        .select('*')
        .or(`town_id.eq.${townId},town_id.is.null`)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);
      if (annData) setAnnouncements(annData);

      // REALTIME channel: town presence + work_changes + activity
      const channelName = 'town:' + townId;
      chan = supabase.channel(channelName, { config: { presence: { key: u.id } } })
        .on('presence', { event: 'sync' }, () => {
          const state = chan.presenceState();
          const list: PresenceUser[] = [];
          Object.values(state).forEach(presences => {
            presences.forEach(p => {
              const data = p as any;
              if (data.user_id !== u.id && data.user_id && data.name) {
                list.push({ user_id: data.user_id, name: data.name });
              }
            });
          });
          setPresence(list);
        })
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          const joined: PresenceUser[] = [];
          newPresences.forEach(p => {
            const data = p as any;
            if (data.user_id !== u.id && data.user_id && data.name) {
              joined.push({ user_id: data.user_id, name: data.name });
            }
          });
          setPresence(prev => [...prev.filter(x => !joined.some(j => j.user_id === x.user_id)), ...joined]);
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const left: string[] = [];
          leftPresences.forEach(p => {
            const data = p as any;
            if (data.user_id && data.user_id !== u.id) {
              left.push(data.user_id);
            }
          });
          setPresence(prev => prev.filter(x => !left.includes(x.user_id)));
        })
        .on('postgres_changes', { event: '*', schema: 'uto', table: 'community_work', filter: 'town_id=eq.' + townId }, () => reloadWorksAndStats(townId!, roleKey))
        .on('postgres_changes', { event: '*', schema: 'uto', table: 'work_approvals' }, async () => {
          const { data: actData } = await supabase.rpc('town_activity', { _town_id: townId, _limit: 30 });
          if (actData) setActivity(actData as ActivityRow[]);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await chan.track({ user_id: u.id, name: u.email?.split('@')[0] || 'Coordinator', online_at: new Date().toISOString() });
          }
        });

      // Notifications channel
      notifChan = supabase.channel('notif:' + u.id)
        .on('postgres_changes', { event: 'INSERT', schema: 'uto', table: 'notifications', filter: 'user_id=eq.' + u.id }, (payload) => {
          setNotifs(n => [payload.new as Notification, ...n].slice(0, 30));
          setUnreadNotifs(n => n + 1);
        })
        .subscribe();

      // Assignments channel — refetch my_assignments on any change
      assignChan = supabase.channel('assign:' + u.id)
        .on('postgres_changes', { event: '*', schema: 'uto', table: 'work_assignments', filter: 'assignee_id=eq.' + u.id }, async () => {
          const { data: aData } = await supabase.rpc('my_assignments');
          if (aData) setAssignments(aData as Assignment[]);
        })
        .subscribe();

      // Announcements channel
      annChan = supabase.channel('ann:' + townId)
        .on('postgres_changes', { event: '*', schema: 'uto', table: 'announcements' }, async () => {
          const { data: annData } = await supabase
            .from('announcements')
            .select('*')
            .or(`town_id.eq.${townId},town_id.is.null`)
            .order('pinned', { ascending: false })
            .order('created_at', { ascending: false })
            .limit(50);
          if (annData) setAnnouncements(annData);
        })
        .subscribe();

      setAuthState('ready');
    })();

    return () => {
      if (chan) supabase.removeChannel(chan);
      if (notifChan) supabase.removeChannel(notifChan);
      if (assignChan) supabase.removeChannel(assignChan);
      if (annChan) supabase.removeChannel(annChan);
    };
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  const markNotifRead = async (id: string) => {
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    setNotifs(n => n.map(x => x.id === id ? { ...x, read_at: new Date().toISOString() } : x));
    setUnreadNotifs(x => Math.max(0, x - 1));
  };

  if (authState === 'loading') return <Loader>Loading workspace...</Loader>;
  if (authState === 'not_logged_in') return <Gate icon={<MapPin size={48} color="#EEB849" />} title="Ubuntu Workspace" body="Sign in with your coordinator email." href="/login?next=/workspace" />;
  if (authState === 'no_role') return <Gate icon={<AlertCircle size={48} color="#E8734A" />} title="Not a Coordinator" body={`Signed in as ${user?.email}`} body2="You need a coordinator role." />;

  const openAssignments = assignments.filter(a => a.status === 'open');

  return (
    <div style={{ minHeight: '100vh', background: '#FBF4E6' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E8DCC8', background: 'white', padding: '12px 0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEB84922', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} color="#EEB849" />
            </div>
            <div>
              <h1 style={{ fontSize: 15, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Ubuntu Workspace</h1>
              <p style={{ fontSize: 11, color: '#999', margin: 0 }}>{town?.name || 'Your Town'}</p>
            </div>
          </div>

          {/* Presence dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666' }}>
            <Radio size={12} color="#10b981" style={{ animation: 'pulse 2s infinite' }} />
            <span>{presence.length + 1} online</span>
            <div style={{ display: 'flex', marginLeft: 4 }}>
              {presence.slice(0, 4).map((p, i) => (
                <div key={i} title={p.name} style={{ width: 22, height: 22, borderRadius: '50%', background: '#EEB849', border: '2px solid white', marginLeft: i === 0 ? 0 : -8, fontSize: 10, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(p.name || '?')[0].toUpperCase()}
                </div>
              ))}
            </div>
          </div>

          {/* Readiness gauge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <Shield size={12} color="#059669" />
            <div style={{ width: 60, height: 6, background: '#E8DCC8', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: readiness + '%', height: '100%', background: readiness > 70 ? '#059669' : readiness > 40 ? '#D97706' : '#DC2626', transition: 'width 0.6s' }} />
            </div>
            <span style={{ fontWeight: 700, color: '#1A1A2E' }}>{readiness}</span>
          </div>

          {/* Inbox badge (open assignments count) */}
          {openAssignments.length > 0 && (
            <button onClick={() => setTab('inbox')} style={{ background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#92400E', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Inbox size={12} /> {openAssignments.length} open
            </button>
          )}

          {/* Notifications bell */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifs(!showNotifs)} style={{ background: 'none', border: 'none', cursor: 'pointer', position: 'relative', padding: 6 }}>
              <Bell size={20} color="#666" />
              {unreadNotifs > 0 && <span style={{ position: 'absolute', top: 0, right: 0, background: '#DC2626', color: 'white', fontSize: 9, fontWeight: 700, borderRadius: '999px', padding: '2px 5px', minWidth: 14 }}>{unreadNotifs > 9 ? '9+' : unreadNotifs}</span>}
            </button>
            {showNotifs && (
              <div style={{ position: 'absolute', top: 38, right: 0, width: 320, background: 'white', border: '1px solid #E8DCC8', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)', zIndex: 100, maxHeight: 440, overflowY: 'auto' }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #E8DCC8', fontWeight: 700, fontSize: 13 }}>Notifications</div>
                {notifs.length === 0 ? <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 12 }}>All clear ✨</div> : notifs.map(n => (
                  <div key={n.id} onClick={() => { markNotifRead(n.id); if (n.work_id) window.location.href = '/workspace/work?id=' + n.work_id; }} style={{ padding: '10px 14px', borderBottom: '1px solid #F3EDE0', cursor: n.read_at ? 'default' : 'pointer', background: n.read_at ? 'white' : '#FFFBEB' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {n.type === 'assignment' && <UserPlus size={12} color="#D97706" />}
                      {n.type === 'mention' && <MessageCircle size={12} color="#4F46E5" />}
                      {n.type === 'approval' && <CheckCircle size={12} color="#059669" />}
                      {n.type === 'rejection' && <AlertCircle size={12} color="#DC2626" />}
                      {n.title}
                    </div>
                    {n.body && <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{n.body}</div>}
                    <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{new Date(n.created_at).toLocaleString('en-ZA')}</div>
                  </div>
                )).filter((n, i) => i < 30)}
              </div>
            )}
          </div>

          {town?.slug && <Link href={`/town/${town.slug}`} style={{ fontSize: 12, color: '#B8860B', textDecoration: 'none' }}>Public →</Link>}
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}><LogOut size={18} /></button>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1100, margin: '8px auto 0', padding: '0 16px', display: 'flex', gap: 4 }}>
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '8px 14px', borderRadius: 8, background: active ? '#EEB849' : 'transparent', color: active ? 'white' : '#666', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon size={14} /> {t.label}
              {t.id === 'inbox' && openAssignments.length > 0 && <span style={{ background: active ? 'white' : '#EEB849', color: active ? '#EEB849' : 'white', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{openAssignments.length}</span>}
            </button>;
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 16px' }}>
        {/* Announcements strip — always visible */}
        {announcements.length > 0 && <AnnouncementsStrip announcements={announcements} townId={town?.id || null} userId={user?.id} />}

        {tab === 'work' && <WorkTab works={works} stats={stats} town={town} />}
        {tab === 'inbox' && <InboxTab assignments={assignments} />}
        {tab === 'activity' && <ActivityTab activity={activity} />}
        {tab === 'missions' && <MissionsTab missions={missions} readiness={readiness} />}
        {tab === 'leaderboard' && <LeaderboardTab />}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}

// ─── ANNOUNCEMENTS STRIP ──────────────────────────────────────────────────────
function AnnouncementsStrip({ announcements, townId, userId }: { announcements: Announcement[], townId: string | null, userId: string }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [pinned, setPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const post = async () => {
    if (!title.trim() || !townId) return;
    setSubmitting(true);
    await supabase.from('announcements').insert({ town_id: townId, author_id: userId, title, body: body || null, pinned });
    setTitle(''); setBody(''); setPinned(false); setShowForm(false);
    setSubmitting(false);
  };

  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', marginBottom: 16, overflow: 'hidden' }}>
      <div style={{ padding: '10px 18px', borderBottom: '1px solid #E8DCC8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Megaphone size={14} color="#EEB849" /> Announcements
        </h3>
        <button onClick={() => setShowForm(!showForm)} style={{ background: '#EEB849', color: 'white', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Plus size={12} /> Post
        </button>
      </div>

      {showForm && (
        <div style={{ padding: 14, borderBottom: '1px solid #E8DCC8', background: '#FFFBEB' }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E8DCC8', fontSize: 13, marginBottom: 8, boxSizing: 'border-box' }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Body (optional)" rows={2} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #E8DCC8', fontSize: 13, marginBottom: 8, boxSizing: 'border-box', resize: 'vertical' }} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#666', marginBottom: 10, cursor: 'pointer' }}>
            <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} style={{ cursor: 'pointer' }} /> Pin to top
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={post} disabled={submitting || !title.trim()} style={{ background: '#059669', color: 'white', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, opacity: submitting ? 0.6 : 1 }}>
              <Send size={12} /> {submitting ? 'Posting…' : 'Post'}
            </button>
            <button onClick={() => setShowForm(false)} style={{ background: 'transparent', color: '#666', border: '1px solid #E8DCC8', borderRadius: 8, padding: '8px 14px', fontSize: 12, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      <div>
        {announcements.slice(0, 5).map(a => (
          <div key={a.id} style={{ padding: '10px 18px', borderBottom: '1px solid #F3EDE0', display: 'flex', gap: 10 }}>
            {a.pinned && <Pin size={12} color="#EEB849" style={{ marginTop: 2, flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1A1A2E' }}>{a.title}</div>
              {a.body && <div style={{ fontSize: 12, color: '#666', marginTop: 2 }}>{a.body}</div>}
              <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>{new Date(a.created_at).toLocaleString('en-ZA')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TAB: INBOX ──────────────────────────────────────────────────────────────
function InboxTab({ assignments }: { assignments: Assignment[] }) {
  const openOnes = assignments.filter(a => a.status === 'open');
  const doneOnes = assignments.filter(a => a.status === 'done');
  const droppedOnes = assignments.filter(a => a.status === 'dropped');

  const markDone = async (id: string) => {
    await supabase.from('work_assignments').update({ status: 'done', completed_at: new Date().toISOString() }).eq('id', id);
  };
  const markDropped = async (id: string) => {
    await supabase.from('work_assignments').update({ status: 'dropped' }).eq('id', id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {[
          { l: 'Open', v: openOnes.length, c: '#D97706', bg: '#FFFBEB' },
          { l: 'Done', v: doneOnes.length, c: '#059669', bg: '#ECFDF5' },
          { l: 'Dropped', v: droppedOnes.length, c: '#6B7280', bg: '#F9FAFB' },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: 14, border: '1px solid #E8DCC8' }}>
            <span style={{ fontSize: 11, color: '#666' }}>{s.l}</span>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', margin: '6px 0 0' }}>{s.v}</p>
          </div>
        ))}
      </div>

      {/* Open assignments */}
      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8DCC8' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>🔴 Open Assignments</h2>
        </div>
        {openOnes.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 13 }}>No open assignments. 🎉</div>
        ) : <div>{openOnes.map(a => (
          <AssignmentRow key={a.id} a={a} onDone={markDone} onDropped={markDropped} />
        ))}</div>}
      </div>

      {/* Completed */}
      {(doneOnes.length > 0 || droppedOnes.length > 0) && (
        <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8DCC8' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Completed & Dropped</h2>
          </div>
          <div>{[...doneOnes, ...droppedOnes].slice(0, 20).map(a => (
            <div key={a.id} style={{ padding: '10px 18px', borderBottom: '1px solid #F3EDE0', opacity: 0.6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 11 }}>{WORK_TYPE_LABELS[a.work_type] || a.work_type}</span>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: a.status === 'done' ? '#D1FAE5' : '#F3F4F6', color: a.status === 'done' ? '#047857' : '#6B7280' }}>{a.status}</span>
              </div>
              <div style={{ fontSize: 13, color: '#1A1A2E' }}>{a.title}</div>
              {a.note && <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{a.note}</div>}
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}

function AssignmentRow({ a, onDone, onDropped }: { a: Assignment; onDone: (id: string) => void; onDropped: (id: string) => void }) {
  return (
    <div style={{ padding: '12px 18px', borderBottom: '1px solid #F3EDE0' }}>
      <Link href={`/workspace/work?id=${a.work_id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12 }}>{WORK_TYPE_LABELS[a.work_type] || a.work_type}</span>
          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 20, background: '#FEF3C7', color: '#B45309' }}>open</span>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{a.title}</p>
        {a.note && <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{a.note}</p>}
      </Link>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button onClick={() => onDone(a.id)} style={{ background: '#D1FAE5', color: '#047857', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Check size={12} /> Done
        </button>
        <button onClick={() => onDropped(a.id)} style={{ background: '#F3F4F6', color: '#6B7280', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
          Drop
        </button>
      </div>
    </div>
  );
}

// ─── TAB: WORK ────────────────────────────────────────────────────────────────
function WorkTab({ works, stats, town }: { works: CommunityWork[], stats: any, town: TownInfo | null }) {
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { l: 'Published', v: stats.published, c: '#059669', bg: '#ECFDF5' },
          { l: 'Pending', v: stats.pending, c: '#D97706', bg: '#FFFBEB' },
          { l: 'Drafts', v: stats.draft, c: '#6B7280', bg: '#F9FAFB' },
          { l: 'Total', v: stats.total, c: '#4F46E5', bg: '#EEF2FF' },
        ].map(s => (
          <div key={s.l} style={{ background: s.bg, borderRadius: 12, padding: 14, border: '1px solid #E8DCC8' }}>
            <span style={{ fontSize: 11, color: '#666' }}>{s.l}</span>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#1A1A2E', margin: '6px 0 0' }}>{s.v}</p>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: 14, padding: 18, marginBottom: 16, border: '1px solid #E8DCC8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Add Community Work</h2>
          <p style={{ fontSize: 12, color: '#666', margin: '4px 0 0' }}>Register a daycare, worker, host, business, event, or podcast. Consent + GPS verified.</p>
        </div>
        <Link href="/workspace/new" style={{ background: '#EEB849', color: 'white', padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={14} /> New
        </Link>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8DCC8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Your Community Work</h2>
          <span style={{ fontSize: 11, color: '#999' }}>🔴 Live</span>
        </div>
        {works.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center' }}><FileText size={36} color="#E8DCC8" style={{ margin: '0 auto 12px' }} /><p style={{ color: '#999', fontSize: 13 }}>No community work yet.</p></div>
        ) : <div>{works.map(w => <WorkRow key={w.id} w={w} />)}</div>}
      </div>
    </>
  );
}

function WorkRow({ w }: { w: CommunityWork }) {
  const verified = w.photo_verified && w.gps_verified && w.contact_verified;
  return (
    <Link href={`/workspace/work?id=${w.id}`} style={{ padding: '12px 18px', borderBottom: '1px solid #F3EDE0', display: 'block', textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 12 }}>{WORK_TYPE_LABELS[w.type] || w.type}</span>
          <span style={Object.assign({ fontSize: 10, padding: '2px 8px', borderRadius: 20 }, getStatusStyle(w.status))}>{w.status}</span>
          {w.verify_count !== undefined && w.verify_count > 0 && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: '#A7F3D0', color: '#065F46' }}>✓ confirmed ×{w.verify_count}</span>}
          {verified && <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 20, background: '#A7F3D0', color: '#065F46', fontWeight: 700 }}>✓ Verified</span>}
        </div>
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{w.title}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, fontSize: 10, color: '#999' }}>
        <span>{w.visibility}</span>
        <span>·</span>
        {['photo', 'gps', 'contact'].map(v => {
          const on = (v === 'photo' ? w.photo_verified : v === 'gps' ? w.gps_verified : w.contact_verified);
          return <span key={v} style={{ display: 'flex', alignItems: 'center', gap: 2, color: on ? '#059669' : '#CBD5E1' }}>
            <Camera size={10} />{v[0].toUpperCase()}
          </span>;
        })}
        <span>·</span>
        <span>{new Date(w.created_at).toLocaleDateString('en-ZA')}</span>
      </div>
    </Link>
  );
}

// ─── TAB: ACTIVITY ───────────────────────────────────────────────────────────
function ActivityTab({ activity }: { activity: ActivityRow[] }) {
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8DCC8' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Town Activity · last 30 events</h2>
      </div>
      {activity.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 13 }}>No activity yet.</div>
      ) : <div>{activity.map((a, i) => (
        <div key={i} style={{ padding: '10px 18px', borderBottom: '1px solid #F3EDE0', display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#EEB84922', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            {(a.actor || '?')[0].toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13 }}><strong>{a.actor}</strong> {a.action} <em>{WORK_TYPE_LABELS[a.work_type] || a.work_type}</em>: {a.title}</div>
            <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>{new Date(a.at).toLocaleString('en-ZA')} → {a.status}</div>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}

// ─── TAB: MISSIONS ───────────────────────────────────────────────────────────
function MissionsTab({ missions, readiness }: { missions: Mission[], readiness: number }) {
  const active = missions.filter(m => !m.complete);
  const streak = missions.filter(m => m.done > 0).length;
  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        <div style={{ background: 'linear-gradient(135deg,#EEB849,#D97706)', borderRadius: 14, padding: 18, color: 'white' }}>
          <div style={{ fontSize: 11, opacity: 0.9 }}>Town Readiness</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{readiness}<span style={{ fontSize: 14 }}>/100</span></div>
          <div style={{ fontSize: 10, opacity: 0.8, marginTop: 4 }}>Coverage + volume + verification</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: 18, border: '1px solid #E8DCC8' }}>
          <div style={{ fontSize: 11, color: '#666' }}>🔥 Active Streak</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: '#1A1A2E' }}>{streak}</div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>Missions completed</div>
        </div>
        <div style={{ background: 'white', borderRadius: 14, padding: 18, border: '1px solid #E8DCC8' }}>
          <div style={{ fontSize: 11, color: '#666' }}>🎯 Today's Targets</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: '#1A1A2E' }}>{active.length}</div>
          <div style={{ fontSize: 10, color: '#999', marginTop: 4 }}>Remaining</div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8DCC8' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Bootcamp Missions</h2>
        </div>
        {missions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 13 }}>Loading missions…</div>
        ) : <div>{missions.map(m => {
          const pct = Math.min(100, Math.round((m.done / m.target) * 100));
          const done = m.done >= m.target;
          return (
            <div key={m.key} style={{ padding: '12px 18px', borderBottom: '1px solid #F3EDE0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{m.title}</div>
                <div style={{ fontSize: 11, color: '#666' }}>{m.done}/{m.target}</div>
              </div>
              <div style={{ height: 6, background: '#E8DCC8', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: pct + '%', height: '100%', background: done ? '#059669' : '#EEB849', transition: 'width 0.4s' }} />
              </div>
            </div>
          );
        })}</div>}
      </div>
    </>
  );
}

// ─── TAB: LEADERBOARD ────────────────────────────────────────────────────────
function LeaderboardTab() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('coordinators').select('id, display_name, reliability_score, town_id').order('reliability_score', { ascending: false, nullsFirst: false }).limit(20);
      if (data) setRows(data);
    })();
  }, []);
  return (
    <div style={{ background: 'white', borderRadius: 14, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
      <div style={{ padding: '12px 18px', borderBottom: '1px solid #E8DCC8' }}>
        <h2 style={{ fontSize: 14, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>🏆 Coordinator Leaderboard</h2>
      </div>
      {rows.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#999', fontSize: 13 }}>Loading…</div>
      ) : <div>{rows.map((r, i) => (
        <div key={r.id} style={{ padding: '10px 18px', borderBottom: '1px solid #F3EDE0', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 26, fontWeight: 800, color: i === 0 ? '#EEB849' : i === 1 ? '#9CA3AF' : i === 2 ? '#B45309' : '#1A1A2E', fontSize: 14 }}>{i + 1}</div>
          <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{r.display_name || 'Coordinator'}</div>
          <div style={{ fontSize: 12, color: '#059669', fontWeight: 700 }}>{Math.round((r.reliability_score || 0) * 100)} pts</div>
        </div>
      ))}</div>}
    </div>
  );
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function Loader({ children }: { children: React.ReactNode }) {
  return <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ width: 32, height: 32, border: '2px solid #EEB849', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
      <p style={{ color: '#666', fontSize: 13 }}>{children}</p>
    </div>
  </div>;
}

function Gate({ icon, title, body, body2, href }: { icon: React.ReactNode, title: string, body: string, body2?: string, href?: string }) {
  return <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ background: 'white', borderRadius: 16, padding: 40, textAlign: 'center', maxWidth: 400, border: '1px solid #E8DCC8' }}>
      <div style={{ margin: '0 auto 14px' }}>{icon}</div>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#1A1A2E' }}>{title}</h1>
      <p style={{ color: '#666', marginBottom: 8, fontSize: 13 }}>{body}</p>
      {body2 && <p style={{ color: '#666', marginBottom: 20, fontSize: 13 }}>{body2}</p>}
      {href && <Link href={href} style={{ background: '#EEB849', color: 'white', padding: '10px 28px', borderRadius: 10, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Sign In →</Link>}
    </div>
  </div>;
}

function getStatusStyle(status: string): React.CSSProperties {
  const s: Record<string, React.CSSProperties> = {
    draft: { background: '#F3F4F6', color: '#4B5563' },
    submitted: { background: '#DBEAFE', color: '#1D4ED8' },
    in_review: { background: '#FEF3C7', color: '#B45309' },
    approved: { background: '#D1FAE5', color: '#047857' },
    published: { background: '#A7F3D0', color: '#065F46' },
    rejected: { background: '#FEE2E2', color: '#DC2626' },
    archived: { background: '#F3F4F6', color: '#6B7280' },
  };
  return s[status] || s.draft;
}
