'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin, Users, Briefcase, Signal, Sparkles, CheckCircle, AlertCircle, LogOut, TrendingUp, Send, Share2, MessageCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface Town { id: string; name: string; slug: string; province_id: string | null; archetype: string | null; population_estimate: number | null; }
interface Opp { id: string; title: string; type: string | null; town_id: string; metadata: Record<string, unknown> | null; }
interface Sig { id: string; title: string; category: string; status: string; town_id: string; }
interface Coord { id: string; display_name: string; status: string; phone: string | null; email: string | null; }

const BRANDS = [
  { key: 'inside_town', icon: '🎙️', name: 'Inside.Town', desc: 'Community media' },
  { key: 'framesouth', icon: '📸', name: 'FrameSouth', desc: 'Visual proof' },
  { key: 'fixeasy24', icon: '🔧', name: 'FixEasy24', desc: 'Services' },
  { key: 'kasibuy', icon: '🛒', name: 'KasiBuy', desc: 'Commerce' },
  { key: 'familyhouse', icon: '🏠', name: 'FamilyHouse', desc: 'Hospitality' },
  { key: 'ecochar', icon: '🌿', name: 'EcoChar', desc: 'Training' },
  { key: 'buntubar', icon: '🍹', name: 'BuntuBar', desc: 'Events' },
  { key: 'aicafe', icon: '🤖', name: 'AI Café', desc: 'Digital access' },
  { key: 'ubuntu_academy', icon: '🎓', name: 'Academy', desc: 'Skills' },
  { key: 'orbit_music', icon: '🎵', name: 'Orbit Music', desc: 'Youth music' },
];

export default function TownDetail({ slug }: { slug: string }) {
  const [town, setTown] = useState<Town | null>(null);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [sigs, setSigs] = useState<Sig[]>([]);
  const [coords, setCoords] = useState<Coord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('opps');
  const [expandedOpp, setExpandedOpp] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      const { data: t } = await supabase.from('towns').select('*').eq('slug', slug).single();
      if (!t) { setLoading(false); return; }
      setTown(t);
      const [o, s, c] = await Promise.all([
        supabase.from('opportunities').select('*').eq('town_id', t.id),
        supabase.from('town_signals').select('*').eq('town_id', t.id),
        supabase.from('coordinators').select('*').eq('town_id', t.id),
      ]);
      if (o.data) setOpps(o.data);
      if (s.data) setSigs(s.data);
      if (c.data) setCoords(c.data);
      setLoading(false);
    }
    load();
  }, [slug]);

  const submitInterest = async (oppId: string) => {
    setSubmitted(prev => new Set(prev).add(oppId));
    setExpandedOpp(null);
  };

  if (loading) return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-ubuntu-gold border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  if (!town) return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-ubuntu-orange mb-3">Town Not Found</h1>
        <Link href="/towns" className="text-ubuntu-gold-dark hover:underline">← Browse all towns</Link>
      </div>
    </div>
  );

  const brandCounts: Record<string, number> = {};
  opps.forEach(o => { const e = ((o.metadata as Record<string, string>)?.ecosystem); if (e) brandCounts[e] = (brandCounts[e] || 0) + 1; });
  const activeBrands = Object.keys(brandCounts).length;
  const pop = town.population_estimate ? (town.population_estimate >= 1000000 ? (town.population_estimate / 1000000).toFixed(1) + 'M' : town.population_estimate >= 1000 ? Math.round(town.population_estimate / 1000) + 'K' : town.population_estimate.toString()) : 'N/A';
  const status = coords.length > 0 && sigs.length > 0 ? 'Active' : coords.length > 0 ? 'Growing' : 'Seeding';

  const tabs = [
    { id: 'opps', label: 'Opportunities', count: opps.length },
    { id: 'signals', label: 'Signals', count: sigs.length },
    { id: 'brands', label: 'Brands', count: activeBrands + '/10' },
    { id: 'team', label: 'Team', count: coords.length },
  ];

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <div className="relative py-12 text-center" style={{ background: 'linear-gradient(135deg, rgba(238,184,73,0.08), rgba(185,129,20,0.04))' }}>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-3" style={{ background: status === 'Active' ? 'rgba(16,185,129,0.1)' : 'rgba(238,184,73,0.1)', color: status === 'Active' ? '#059669' : '#b98114', border: '1px solid ' + (status === 'Active' ? 'rgba(16,185,129,0.2)' : 'rgba(238,184,73,0.2)') }}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: status === 'Active' ? '#10b981' : '#eeb849' }}></span>
          {status} Town
        </div>
        <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">{town.name}</h1>
        <div className="flex gap-2 justify-center flex-wrap">
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-ubuntu-gold/10 text-ubuntu-gold-dark border border-ubuntu-gold/20 capitalize">{town.archetype || 'Town'}</span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-ubuntu-card text-ubuntu-text-muted border border-ubuntu-border">Pop: {pop}</span>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-ubuntu-card text-ubuntu-text-muted border border-ubuntu-border">{coords.length} coordinator{coords.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-5 relative z-10">
        <div className="grid grid-cols-4 gap-2">
          {[
            { n: opps.length, l: 'Opportunities', c: 'border-l-[#eeb849]', tc: 'text-ubuntu-gold-dark' },
            { n: coords.length, l: 'Coordinators', c: 'border-l-[#10b981]', tc: 'text-[#10b981]' },
            { n: sigs.length, l: 'Signals', c: 'border-l-[#D87321]', tc: 'text-ubuntu-orange' },
            { n: activeBrands, l: 'Brands', c: 'border-l-[#8b5cf6]', tc: 'text-[#8b5cf6]' },
          ].map(s => (
            <div key={s.l} className={`bg-ubuntu-card border border-ubuntu-border ${s.c} border-l-4 rounded-xl p-4 text-center`}>
              <div className={`text-2xl font-extrabold ${s.tc}`}>{s.n}</div>
              <div className="text-[9px] uppercase tracking-wider text-ubuntu-text-muted">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-1 border-b border-ubuntu-border mb-4">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${tab === t.id ? 'border-ubuntu-gold text-ubuntu-gold-dark' : 'border-transparent text-ubuntu-text-muted hover:text-ubuntu-text'}`}>
              {t.label} <span className="ml-1 opacity-60">{t.count}</span>
            </button>
          ))}
        </div>

        {tab === 'opps' && (
          <div>
            {opps.length === 0 ? (
              <div className="text-center py-12 text-ubuntu-text-muted">
                <Briefcase className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold mb-1">No opportunities yet</p>
                <p className="text-sm">Know of one? <Link href="/submit-signal" className="text-ubuntu-gold-dark underline">Submit it as a signal</Link></p>
              </div>
            ) : opps.map(o => {
              const eco = (o.metadata as Record<string, string>)?.ecosystem || '';
              const isExpanded = expandedOpp === o.id;
              const isDone = submitted.has(o.id);
              return (
                <div key={o.id} className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-4 mb-2 hover:border-ubuntu-gold/30 transition-all">
                  <div className="text-sm font-semibold mb-1">{o.title}</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {eco && <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#301336]/5 text-[#8b5cf6]">{eco.replace(/_/g, ' ')}</span>}
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-ubuntu-cream text-ubuntu-text-muted capitalize">{o.type || 'general'}</span>
                    <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#10b981]/8 text-[#059669]">Open</span>
                  </div>
                  {isDone ? (
                    <div className="mt-2 text-xs text-[#059669] font-semibold flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> Interest registered!</div>
                  ) : (
                    <>
                      <button onClick={() => setExpandedOpp(isExpanded ? null : o.id)} className={`mt-2 text-[11px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${isExpanded ? 'bg-red-50 text-red-600 border-red-200' : 'bg-ubuntu-gold/8 text-ubuntu-gold-dark border-ubuntu-gold/20 hover:bg-ubuntu-gold hover:text-white hover:border-ubuntu-gold'}`}>
                        {isExpanded ? '✕ Cancel' : '👋 I\'m Interested'}
                      </button>
                      {isExpanded && (
                        <div className="mt-2 p-3 bg-ubuntu-gold/[0.03] border border-ubuntu-gold/10 rounded-lg space-y-2">
                          <input placeholder="Your name" className="w-full px-3 py-2 text-sm border border-ubuntu-border rounded-lg bg-ubuntu-card focus:border-ubuntu-gold outline-none" />
                          <input placeholder="Phone" className="w-full px-3 py-2 text-sm border border-ubuntu-border rounded-lg bg-ubuntu-card focus:border-ubuntu-gold outline-none" />
                          <input placeholder="Email" className="w-full px-3 py-2 text-sm border border-ubuntu-border rounded-lg bg-ubuntu-card focus:border-ubuntu-gold outline-none" />
                          <button onClick={() => submitInterest(o.id)} className="w-full py-2 bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white text-sm font-bold rounded-lg">Submit Interest →</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'signals' && (
          <div>
            {sigs.map(s => {
              const dotColor = s.category === 'infrastructure' ? 'bg-ubuntu-orange' : s.category === 'safety' ? 'bg-[#ef4444]' : s.category === 'education' ? 'bg-[#3b82f6]' : s.category === 'economic' ? 'bg-[#10b981]' : 'bg-[#8b5cf6]';
              return (
                <div key={s.id} className="flex gap-3 items-start bg-ubuntu-card border border-ubuntu-border rounded-xl p-3 mb-2">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColor}`}></div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-ubuntu-text-muted capitalize">{s.category}</div>
                    <div className="flex gap-2 items-center mt-1">
                      <button className="text-[10px] text-ubuntu-text-muted bg-ubuntu-cream border border-ubuntu-border px-2 py-0.5 rounded hover:border-ubuntu-gold hover:text-ubuntu-gold-dark">▲ +1</button>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded bg-ubuntu-orange/10 text-ubuntu-orange">⏳ {s.status}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {sigs.length === 0 && (
              <div className="text-center py-12 text-ubuntu-text-muted">
                <Signal className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p className="font-semibold mb-1">No signals yet</p>
                <p className="text-sm">Be the first to report what {town.name} needs.</p>
              </div>
            )}
            <Link href="/submit-signal" className="flex items-center justify-center gap-2 w-full py-3 mt-2 border border-dashed border-ubuntu-orange/25 rounded-xl text-ubuntu-orange text-sm font-semibold hover:bg-ubuntu-orange hover:text-white hover:border-solid transition-all">
              📢 Submit a Signal for {town.name}
            </Link>
          </div>
        )}

        {tab === 'brands' && (
          <div>
            <div className="grid grid-cols-5 gap-2 mb-4">
              {BRANDS.map(b => {
                const isActive = !!brandCounts[b.key];
                return (
                  <div key={b.key} className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${isActive ? 'bg-[#10b981]/5 border-[#10b981]/20' : 'bg-ubuntu-card border-ubuntu-border opacity-40'}`}>
                    <div className="text-xl mb-1">{b.icon}</div>
                    <div className="text-[9px] font-bold">{b.name}</div>
                    <div className={`text-[7px] font-bold uppercase mt-1 ${isActive ? 'text-[#059669]' : 'text-ubuntu-text-muted'}`}>
                      {isActive ? '✓ Active' : 'Available'}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-4">
              <div className="text-sm font-semibold mb-2">{activeBrands} of 10 brands active</div>
              <div className="h-2 bg-ubuntu-cream rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-ubuntu-gold to-ubuntu-orange rounded-full" style={{ width: activeBrands * 10 + '%' }}></div>
              </div>
              {activeBrands < 10 && <p className="text-xs text-ubuntu-text-muted mt-2">{10 - activeBrands} available. <Link href="/apply" className="text-ubuntu-gold-dark underline">Apply to run one →</Link></p>}
            </div>
          </div>
        )}

        {tab === 'team' && (
          <div>
            {coords.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-ubuntu-card border border-ubuntu-border rounded-xl p-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-[#301336]/10 text-[#8b5cf6] flex items-center justify-center font-bold text-sm">{c.display_name.charAt(0)}</div>
                <div className="flex-1"><div className="text-sm font-semibold">{c.display_name}</div><div className="text-xs text-[#10b981]">● {c.status}</div></div>
                {c.phone && <a href={'https://wa.me/' + c.phone.replace(/\s/g, '')} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-[#25d366] bg-[#25d366]/8 border border-[#25d366]/15 px-3 py-1.5 rounded-lg hover:bg-[#25d366] hover:text-white">💬 WhatsApp</a>}
              </div>
            ))}
            {coords.length === 0 && <div className="text-center py-12 text-ubuntu-text-muted"><Users className="w-10 h-10 mx-auto mb-3 opacity-30" /><p className="font-semibold">No coordinators yet</p></div>}
            <Link href="/apply" className="flex items-center justify-center gap-2 w-full py-3 mt-2 border border-dashed border-[#8b5cf6]/20 rounded-xl text-[#8b5cf6] text-sm font-semibold hover:bg-[#8b5cf6] hover:text-white hover:border-solid transition-all">
              👥 {coords.length > 0 ? 'Become a Co-Coordinator' : 'Coordinate ' + town.name}
            </Link>
            <div className="mt-6"><h3 className="text-xs font-bold uppercase tracking-wider text-ubuntu-text-muted mb-3">Quick Actions</h3>
              <div className="grid grid-cols-3 gap-2">
                {[{i:'📝',l:'Build CV',h:'/cv'},{i:'📢',l:'Report Issue',h:'/submit-signal'},{i:'👥',l:'Apply',h:'/apply'},{i:'💬',l:'Kopano AI',h:'/chat'},{i:'🔍',l:'All Towns',h:'/towns'},{i:'📤',l:'Share',h:'#'}].map(a => (
                  <Link key={a.l} href={a.h} className="flex items-center gap-2 p-2.5 bg-ubuntu-card border border-ubuntu-border rounded-lg text-xs font-medium hover:border-ubuntu-gold/30">{a.i} {a.l}</Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="text-center py-12 mt-8 border-t border-ubuntu-border">
        <h3 className="text-xl font-extrabold mb-2">{town.name} has {activeBrands} active brand{activeBrands !== 1 ? 's' : ''} and {opps.length} opportunit{opps.length !== 1 ? 'ies' : 'y'}.</h3>
        <p className="text-sm text-ubuntu-text-muted max-w-md mx-auto mb-5">{coords.length > 0 ? 'Join the team driving real impact.' : 'This town needs its first coordinator.'}</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/apply" className="bg-ubuntu-gold hover:bg-ubuntu-gold-dark text-white px-6 py-3 rounded-xl font-bold text-sm">Apply to Coordinate {town.name}</Link>
          <Link href="/towns" className="border border-ubuntu-border text-ubuntu-text-muted px-6 py-3 rounded-xl font-semibold text-sm hover:border-ubuntu-gold">Explore Other Towns</Link>
        </div>
      </div>
    </div>
  );
}
