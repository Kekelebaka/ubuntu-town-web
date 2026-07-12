'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { MapPin, Plus, FileText, CheckCircle, Clock, Eye, AlertCircle, LogOut } from 'lucide-react';

type AuthState = 'loading' | 'not_logged_in' | 'no_role' | 'ready';

interface CommunityWork {
  id: string;
  type: string;
  title: string;
  status: string;
  visibility: string;
  created_at: string;
  published_at: string | null;
}

interface TownInfo {
  id: string;
  name: string;
  slug: string;
}

const WORK_TYPE_LABELS: Record<string, string> = {
  fixeasy_worker: '🔧 FixEasy Worker',
  familyhouse: '🏠 FamilyHouse Host',
  business: '🛒 Local Business',
  event: '🎉 Community Event',
  podcast: '🎙️ Inside.Town Podcast',
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  in_review: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  published: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
};

export default function WorkspacePage() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [town, setTown] = useState<TownInfo | null>(null);
  const [works, setWorks] = useState<CommunityWork[]>([]);
  const [stats, setStats] = useState({ published: 0, pending: 0, draft: 0, total: 0 });

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setAuthState('not_logged_in'); return; }
      setUserEmail(user.email || '');

      // Check if user has a coordinator role in role_assignments
      const { data: roles } = await supabase
        .from('role_assignments')
        .select('town_id, role_key')
        .eq('user_id', user.id)
        .in('role_key', ['coordinator', 'deputy', 'admin', 'ops'])
        .limit(1);

      if (!roles || roles.length === 0) { setAuthState('no_role'); return; }

      // Get town info
      const townId = roles[0].town_id;
      if (townId) {
        const { data: townData } = await supabase
          .from('towns')
          .select('id, name, slug')
          .eq('id', townId)
          .single();
        if (townData) setTown(townData);
      }

      // Fetch community work for this town
      const query = supabase
        .from('community_work')
        .select('id, type, title, status, visibility, created_at, published_at')
        .order('created_at', { ascending: false });

      // If coordinator (not admin), filter by town
      if (roles[0].role_key === 'coordinator' || roles[0].role_key === 'deputy') {
        query.eq('town_id', townId);
      }

      const { data: workData } = await query;
      if (workData) {
        setWorks(workData);
        setStats({
          published: workData.filter(w => w.status === 'published').length,
          pending: workData.filter(w => ['submitted', 'in_review', 'approved'].includes(w.status)).length,
          draft: workData.filter(w => w.status === 'draft').length,
          total: workData.length,
        });
      }

      setAuthState('ready');
    }
    init();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  if (authState === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '2px solid #EEB849', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#666' }}>Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (authState === 'not_logged_in') {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', maxWidth: 420, border: '1px solid #E8DCC8' }}>
          <MapPin size={48} color="#EEB849" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#1A1A2E' }}>Ubuntu Workspace</h1>
          <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>Sign in with your coordinator email to manage your town&apos;s community work.</p>
          <Link href="/login?next=/workspace" style={{ background: '#EEB849', color: 'white', padding: '12px 32px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'inline-block' }}>
            Sign In →
          </Link>
        </div>
      </div>
    );
  }

  if (authState === 'no_role') {
    return (
      <div style={{ minHeight: '100vh', background: '#FBF4E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: 'white', borderRadius: 16, padding: 48, textAlign: 'center', maxWidth: 420, border: '1px solid #E8DCC8' }}>
          <AlertCircle size={48} color="#E8734A" style={{ margin: '0 auto 16px' }} />
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#1A1A2E' }}>Not a Coordinator</h1>
          <p style={{ color: '#666', marginBottom: 8, fontSize: 14 }}>Signed in as <strong>{userEmail}</strong></p>
          <p style={{ color: '#666', marginBottom: 24, fontSize: 14 }}>You need a coordinator role to access the workspace.</p>
          <button onClick={handleLogout} style={{ border: '1px solid #E8DCC8', color: '#666', padding: '12px 24px', borderRadius: 12, fontSize: 14, background: 'white', cursor: 'pointer' }}>
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FBF4E6' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E8DCC8', background: 'white', padding: '12px 0' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEB84922', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} color="#EEB849" />
            </div>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Ubuntu Workspace</h1>
              <p style={{ fontSize: 11, color: '#999', margin: 0 }}>{town?.name || 'Your Town'}</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {town?.slug && (
              <Link href={`/town/${town.slug}`} style={{ fontSize: 13, color: '#B8860B', textDecoration: 'none' }}>
                View Public Page →
              </Link>
            )}
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '24px 16px' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Published', value: stats.published, icon: <CheckCircle size={18} color="#059669" />, bg: '#ECFDF5' },
            { label: 'Pending', value: stats.pending, icon: <Clock size={18} color="#D97706" />, bg: '#FFFBEB' },
            { label: 'Drafts', value: stats.draft, icon: <FileText size={18} color="#6B7280" />, bg: '#F9FAFB' },
            { label: 'Total', value: stats.total, icon: <Eye size={18} color="#4F46E5" />, bg: '#EEF2FF' },
          ].map(s => (
            <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: 16, border: '1px solid #E8DCC8' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {s.icon}
                <span style={{ fontSize: 11, color: '#666' }}>{s.label}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Add Community Work CTA */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, border: '1px solid #E8DCC8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1A1A2E', margin: '0 0 4px' }}>Add Community Work</h2>
            <p style={{ fontSize: 13, color: '#666', margin: 0 }}>Register a worker, host, business, event, or podcast episode.</p>
          </div>
          <Link href="/workspace/new" style={{ background: '#EEB849', color: 'white', padding: '12px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Plus size={16} /> New
          </Link>
        </div>

        {/* Community Work List */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E8DCC8', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8DCC8' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1A1A2E', margin: 0 }}>Your Community Work</h2>
          </div>
          {works.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center' }}>
              <FileText size={48} color="#E8DCC8" style={{ margin: '0 auto 16px' }} />
              <p style={{ color: '#999', fontSize: 14 }}>No community work yet. Add your first item above.</p>
            </div>
          ) : (
            <div>
              {works.map(w => (
                <div key={w.id} style={{ padding: '14px 20px', borderBottom: '1px solid #F3EDE0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 12 }}>{WORK_TYPE_LABELS[w.type] || w.type}</span>
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, ...getStatusStyle(w.status) }}>{w.status}</span>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#1A1A2E', margin: 0 }}>{w.title}</p>
                    <p style={{ fontSize: 11, color: '#999', margin: '4px 0 0' }}>
                      {w.visibility} · Created {new Date(w.created_at).toLocaleDateString('en-ZA')}
                      {w.published_at && ` · Published ${new Date(w.published_at).toLocaleDateString('en-ZA')}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function getStatusStyle(status: string) {
  const styles: Record<string, React.CSSProperties> = {
    draft: { background: '#F3F4F6', color: '#4B5563' },
    submitted: { background: '#DBEAFE', color: '#1D4ED8' },
    in_review: { background: '#FEF3C7', color: '#B45309' },
    approved: { background: '#D1FAE5', color: '#047857' },
    published: { background: '#A7F3D0', color: '#065F46' },
    rejected: { background: '#FEE2E2', color: '#DC2626' },
    returned: { background: '#FFEDD5', color: '#C2410C' },
  };
  return styles[status] || styles.draft;
}
