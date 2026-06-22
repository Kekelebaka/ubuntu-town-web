'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { MapPin, Users, Briefcase, Signal, AlertCircle, CheckCircle, LogOut, Sparkles, TrendingUp } from 'lucide-react';

interface Coordinator {
  id: string;
  town_id: string;
  display_name: string;
  email: string | null;
  phone: string | null;
  status: string;
  earnings: Record<string, unknown>;
}

interface Town {
  id: string;
  name: string;
  slug: string;
  province_id: string | null;
  archetype: string | null;
  population_estimate: number | null;
}

interface Opportunity {
  id: string;
  title: string;
  type: string | null;
  town_id: string;
  metadata: Record<string, unknown> | null;
}

interface SignalItem {
  id: string;
  title: string;
  category: string;
  status: string;
  town_id: string;
}

type AuthState = 'loading' | 'not_logged_in' | 'not_coordinator' | 'coordinator';

export default function CoordinatorDashboard() {
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [userEmail, setUserEmail] = useState('');
  const [coordinator, setCoordinator] = useState<Coordinator | null>(null);
  const [town, setTown] = useState<Town | null>(null);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [signals, setSignals] = useState<SignalItem[]>([]);
  const [allCoordinators, setAllCoordinators] = useState<Coordinator[]>([]);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) { setAuthState('not_logged_in'); return; }
      setUserEmail(user.email);
      const { data: coordData } = await supabase.from('coordinators').select('*').eq('email', user.email).single();
      if (!coordData) { setAuthState('not_coordinator'); return; }
      setCoordinator(coordData);
      const { data: townData } = await supabase.from('towns').select('*').eq('id', coordData.town_id).single();
      if (townData) setTown(townData);
      const { data: opps } = await supabase.from('opportunities').select('*').eq('town_id', coordData.town_id);
      if (opps) setOpportunities(opps);
      const { data: sigs } = await supabase.from('town_signals').select('*').eq('town_id', coordData.town_id);
      if (sigs) setSignals(sigs);
      const { data: coCoords } = await supabase.from('coordinators').select('*').eq('town_id', coordData.town_id);
      if (coCoords) setAllCoordinators(coCoords);
      setAuthState('coordinator');
    }
    init();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = '/'; };

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ubuntu-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (authState === 'not_logged_in') {
    return (
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-12 text-center max-w-md">
          <MapPin className="w-12 h-12 text-ubuntu-gold mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Coordinator Dashboard</h1>
          <p className="text-muted-foreground mb-6">Sign in with your coordinator email to access your town dashboard.</p>
          <Link href="/login?next=/coordinator" className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-8 py-3 rounded-xl font-bold text-sm transition-all inline-block">Sign In →</Link>
        </div>
      </div>
    );
  }

  if (authState === 'not_coordinator') {
    return (
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-12 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-ubuntu-orange mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-3">Not a Coordinator</h1>
          <p className="text-muted-foreground mb-2">Signed in as <strong>{userEmail}</strong></p>
          <p className="text-muted-foreground mb-6">This email is not linked to a coordinator profile yet.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/sign-up" className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-6 py-3 rounded-xl font-bold text-sm">Apply to Coordinate</Link>
            <button onClick={handleLogout} className="border border-ubuntu-border text-muted-foreground px-6 py-3 rounded-xl text-sm hover:border-ubuntu-gold">Sign Out</button>
          </div>
        </div>
      </div>
    );
  }

  const brandCounts: Record<string, number> = {};
  opportunities.forEach(o => {
    const eco = ((o.metadata as Record<string, string>)?.ecosystem) || 'other';
    brandCounts[eco] = (brandCounts[eco] || 0) + 1;
  });

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <div className="border-b border-ubuntu-border bg-ubuntu-card">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ubuntu-gold/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-ubuntu-gold-dark" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Coordinator Dashboard</h1>
              <p className="text-xs text-muted-foreground">{coordinator?.display_name} — {town?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/town/${town?.slug}`} className="text-sm text-ubuntu-gold-dark hover:underline">View Public Page →</Link>
            <button onClick={handleLogout} className="text-muted-foreground hover:text-ubuntu-text"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><Briefcase className="w-5 h-5 text-ubuntu-gold" /><span className="text-xs text-muted-foreground">Opportunities</span></div>
            <p className="text-3xl font-bold text-ubuntu-gold-dark">{opportunities.length}</p>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><Signal className="w-5 h-5 text-ubuntu-orange" /><span className="text-xs text-muted-foreground">Signals</span></div>
            <p className="text-3xl font-bold text-ubuntu-orange">{signals.length}</p>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><Users className="w-5 h-5 text-ubuntu-purple" /><span className="text-xs text-muted-foreground">Coordinators</span></div>
            <p className="text-3xl font-bold text-ubuntu-purple">{allCoordinators.length}</p>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2"><TrendingUp className="w-5 h-5 text-learning" /><span className="text-xs text-muted-foreground">Population</span></div>
            <p className="text-3xl font-bold text-learning">{town?.population_estimate ? (town.population_estimate / 1000).toFixed(0) + 'k' : 'N/A'}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Town Opportunities</h2>
              <span className="text-xs text-ubuntu-gold-dark bg-ubuntu-gold/10 px-2 py-1 rounded-full">{opportunities.length} active</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {opportunities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No opportunities yet.</p>
              ) : opportunities.map((opp) => {
                const eco = (opp.metadata as Record<string, string>)?.ecosystem;
                return (
                  <div key={opp.id} className="bg-white/60 border border-ubuntu-border rounded-lg p-3 hover:border-ubuntu-gold/50">
                    <h3 className="text-sm font-semibold">{opp.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground capitalize">{opp.type || 'general'}</span>
                      {eco && <span className="text-xs bg-ubuntu-purple/10 text-ubuntu-purple px-2 py-0.5 rounded">{eco.replace(/_/g, ' ')}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Signal Inbox</h2>
              <span className="text-xs text-ubuntu-orange bg-ubuntu-orange/10 px-2 py-1 rounded-full">{signals.length} signals</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {signals.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No signals reported yet.</p>
              ) : signals.map((sig) => (
                <div key={sig.id} className="bg-white/60 border border-ubuntu-border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold">{sig.title}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{sig.category}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded ${sig.status === 'resolved' ? 'bg-learning/10 text-learning' : 'bg-ubuntu-orange/10 text-ubuntu-orange'}`}>
                      {sig.status === 'resolved' ? '✓ Resolved' : '⏳ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Ecosystem Brands</h2>
            <div className="grid grid-cols-2 gap-2">
              {['inside_town','framesouth','fixeasy24','kasibuy','familyhouse','ecochar','buntubar','aicafe','ubuntu_academy','orbit_music'].map((brand) => (
                <div key={brand} className={`flex items-center gap-2 p-2 rounded-lg ${brandCounts[brand] ? 'bg-learning/10' : 'bg-ubuntu-cream'}`}>
                  {brandCounts[brand] ? <CheckCircle className="w-4 h-4 text-learning" /> : <AlertCircle className="w-4 h-4 text-muted-foreground/50" />}
                  <span className={`text-xs capitalize ${brandCounts[brand] ? 'font-medium' : 'text-muted-foreground'}`}>{brand.replace(/_/g, ' ')}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
            <h2 className="text-lg font-bold mb-4">Coordinator Team</h2>
            <div className="space-y-3">
              {allCoordinators.map((coord) => (
                <div key={coord.id} className="flex items-center gap-3 bg-white/60 border border-ubuntu-border rounded-lg p-3">
                  <div className="w-8 h-8 rounded-full bg-ubuntu-purple/20 flex items-center justify-center text-ubuntu-purple text-sm font-bold">{coord.display_name.charAt(0)}</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{coord.display_name}</p>
                    <p className="text-xs text-muted-foreground">{coord.email || 'No email linked'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${coord.status === 'active' ? 'bg-learning/10 text-learning' : 'text-muted-foreground'}`}>{coord.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-8 bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 text-center">
          <h3 className="font-bold mb-2">{town?.name}</h3>
          <p className="text-sm text-muted-foreground capitalize">{town?.archetype} • Population: {town?.population_estimate?.toLocaleString() || 'N/A'}</p>
          <div className="flex gap-3 justify-center mt-4">
            <Link href={`/town/${town?.slug}`} className="text-sm text-ubuntu-gold-dark hover:underline">View Public Page</Link>
            <Link href="/towns" className="text-sm text-muted-foreground hover:underline">Browse All Towns</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
