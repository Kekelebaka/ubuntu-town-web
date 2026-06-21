'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Users, Briefcase, Signal } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface Town {
  id: string;
  name: string;
  slug: string;
  province_id: string | null;
  archetype: string | null;
  population_estimate: number | null;
  created_at: string | null;
}

interface Province {
  id: string;
  name: string;
  slug: string;
}

function TownList() {
  const searchParams = useSearchParams();
  const province = searchParams.get('province');
  const [allTowns, setAllTowns] = useState<Town[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [filteredTowns, setFilteredTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [townsRes, provsRes] = await Promise.all([
        supabase.from('towns').select('*').order('name'),
        supabase.from('provinces').select('*').order('name'),
      ]);
      const towns = townsRes.data || [];
      const provs = provsRes.data || [];
      setAllTowns(towns);
      setProvinces(provs);
      if (province && province !== 'All') {
        const prov = provs.find((p: Province) =>
          p.slug === province || p.name.toLowerCase().replace(/\s+/g, '-') === province
        );
        if (prov) {
          setFilteredTowns(towns.filter((t: Town) => t.province_id === prov.id));
        } else {
          setFilteredTowns(towns);
        }
      } else {
        setFilteredTowns(towns);
      }
      setLoading(false);
    }
    loadData();
  }, [province]);

  function getProvinceName(provinceId: string | null): string {
    if (!provinceId) return 'South Africa';
    const prov = provinces.find(p => p.id === provinceId);
    return prov?.name || 'South Africa';
  }

  const provinceNames = ['All', 'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Limpopo', 'Mpumalanga', 'North West', 'Free State', 'Northern Cape'];

  if (loading) {
    return (
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ubuntu-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading towns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-ubuntu-text mb-4">Enter Ubuntu Town</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Select a town to see its digital twin: opportunities, businesses, services, signals, and AI support.</p>
        </div>
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {provinceNames.map((name) => {
            const href = name === 'All' ? '/towns' : `/towns?province=${name.toLowerCase().replace(/\s+/g, '-')}`;
            const isActive = (name === 'All' && !province) || (name !== 'All' && province === name.toLowerCase().replace(/\s+/g, '-'));
            return (
              <Link key={name} href={href} className={`px-4 py-2 border rounded-full text-sm transition-colors ${isActive ? 'bg-ubuntu-gold border-ubuntu-gold text-white font-bold' : 'bg-ubuntu-card border-ubuntu-border hover:border-ubuntu-gold hover:text-ubuntu-gold-dark'}`}>
                {name}
              </Link>
            );
          })}
        </div>
        <div className="text-center text-sm text-muted-foreground mb-6">
          Showing {filteredTowns.length} of {allTowns.length} towns{province && province !== 'All' ? ` in ${province.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}` : ''}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTowns.map((town) => (
            <Link key={town.slug} href={`/town/${town.slug}`} className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 hover:border-ubuntu-gold transition-colors group">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h2 className="text-xl font-bold text-ubuntu-text group-hover:text-ubuntu-gold-dark transition-colors">{town.name}</h2>
                  <p className="text-sm text-muted-foreground">{getProvinceName(town.province_id)}</p>
                </div>
                <span className="text-xs bg-ubuntu-gold/10 text-ubuntu-gold-dark px-2 py-1 rounded-full capitalize">{town.archetype || 'town'}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-4">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-ubuntu-gold" />
                  <span>Pop: {town.population_estimate ? town.population_estimate.toLocaleString() : 'N/A'}</span>
                </div>
                <MapPin className="w-4 h-4 text-muted-foreground/50" />
              </div>
            </Link>
          ))}
        </div>
        {filteredTowns.length === 0 && (
          <div className="text-center py-12 text-muted-foreground"><p>No towns found. Try a different province filter.</p></div>
        )}
      </div>
    </div>
  );
}

export default function TownsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-ubuntu-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading towns...</p>
        </div>
      </div>
    }>
      <TownList />
    </Suspense>
  );
}
