'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Users, Search } from 'lucide-react';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase-client';
import Fuse from 'fuse.js';

interface Town { id: string; name: string; slug: string; province_id: string | null; archetype: string | null; population_estimate: number | null; }
interface Province { id: string; name: string; slug: string; }

function TownList() {
  const searchParams = useSearchParams();
  const province = searchParams.get('province');
  const [allTowns, setAllTowns] = useState<Town[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [t, p] = await Promise.all([
        supabase.from('towns').select('*').order('name'),
        supabase.from('provinces').select('*').order('name'),
      ]);
      setAllTowns(t.data || []);
      setProvinces(p.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const fuse = useMemo(() => new Fuse(allTowns, { keys: ['name', 'archetype'], threshold: 0.3 }), [allTowns]);

  const provMap = useMemo(() => {
    const m: Record<string, string> = {};
    provinces.forEach(p => { m[p.id] = p.name; });
    return m;
  }, [provinces]);

  const filtered = useMemo(() => {
    let result = search.trim() ? fuse.search(search).map(r => r.item) : [...allTowns];
    if (province && province !== 'All') {
      const prov = provinces.find(p => p.slug === province || p.name.toLowerCase().replace(/\s+/g, '-') === province);
      if (prov) result = result.filter(t => t.province_id === prov.id);
    }
    return result;
  }, [search, province, allTowns, provinces, fuse]);

  const provNames = ['All', ...provinces.map(p => p.name)];

  if (loading) return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-ubuntu-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">Enter Ubuntu Town</h1>
          <p className="text-lg text-ubuntu-text-muted max-w-xl mx-auto">Search 50 towns across 9 provinces. Find opportunities, services, and coordinators.</p>
        </div>

        <div className="relative max-w-md mx-auto mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ubuntu-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search towns... try 'lady' or 'cape'"
            className="w-full pl-11 pr-4 py-3 border border-ubuntu-border rounded-xl bg-ubuntu-card text-ubuntu-text placeholder:text-ubuntu-text-muted focus:outline-none focus:border-ubuntu-gold text-sm"
          />
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-4">
          {provNames.map((name) => {
            const slug = name === 'All' ? null : name.toLowerCase().replace(/\s+/g, '-');
            const href = name === 'All' ? '/towns' : `/towns?province=${slug}`;
            const isActive = (name === 'All' && !province) || (slug && province === slug);
            return (
              <Link key={name} href={href} className={`px-3 py-1.5 border rounded-full text-xs font-semibold transition-all ${isActive ? 'bg-ubuntu-gold border-ubuntu-gold text-white' : 'bg-ubuntu-card border-ubuntu-border text-ubuntu-text-muted hover:border-ubuntu-gold hover:text-ubuntu-gold-dark'}`}>
                {name}
              </Link>
            );
          })}
        </div>

        <div className="text-center text-xs text-ubuntu-text-muted mb-6">
          Showing {filtered.length} of {allTowns.length} towns{search ? ` matching "${search}"` : ''}{province ? ` in ${province.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : ''}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((town) => (
            <Link key={town.slug} href={`/town/${town.slug}`} className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-5 hover:border-ubuntu-gold hover:-translate-y-1 transition-all group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h2 className="text-base font-bold group-hover:text-ubuntu-gold-dark transition-colors">{town.name}</h2>
                  <p className="text-xs text-ubuntu-text-muted">{provMap[town.province_id || ''] || 'South Africa'}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ubuntu-gold/10 text-ubuntu-gold-dark capitalize">{town.archetype || 'town'}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-ubuntu-text-muted">
                <Users className="w-3.5 h-3.5 text-ubuntu-gold" />
                <span>Pop: {town.population_estimate ? town.population_estimate.toLocaleString() : 'N/A'}</span>
              </div>
            </Link>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-ubuntu-text-muted">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No towns found</p>
            <p className="text-sm mt-1">{search ? `No matches for "${search}". Try a different search.` : 'Try a different province filter.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TownsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-ubuntu-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    }>
      <TownList />
    </Suspense>
  );
}
