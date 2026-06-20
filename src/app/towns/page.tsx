'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MapPin, Users, Briefcase, Signal, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { Suspense, useEffect, useState } from 'react';

interface Town {
  id: string;
  name: string;
  slug: string;
  province_id: string;
  population_estimate?: number;
}

interface Province {
  id: string;
  name: string;
  slug: string;
}

function getProvinceName(provinceId: string | null, provinces: Province[]): string {
  if (!provinceId) return 'South Africa';
  const prov = provinces.find(p => p.id === provinceId);
  return prov?.name || 'South Africa';
}

function TownList() {
  const searchParams = useSearchParams();
  const province = searchParams.get('province');
  const [townData, setTownData] = useState<Town[]>([]);
  const [filteredTowns, setFilteredTowns] = useState<Town[]>([]);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: townsData, error: townsError } = await supabase
          .from('towns')
          .select('*');
        
        const { data: provincesData, error: provincesError } = await supabase
          .from('provinces')
          .select('*');

        if (townsData) {
          setTownData(townsData);
          if (province === 'All' || !province) {
            setFilteredTowns(townsData);
          } else {
            const filtered = townsData.filter(t => 
              t.province_id && provincesData?.some(p => p.id === t.province_id && p.name.toLowerCase().replace(' ', '-') === province.toLowerCase())
            );
            setFilteredTowns(filtered);
          }
        }
        
        if (provincesData) {
          setProvinces(provincesData);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    }
    loadData();
  }, [province]);

  const provinceNames = ['All', ...new Set(provinces.map(p => p.name))];
  
  // Compute UI display fields
  const townsWithUI = filteredTowns.map(town => ({
    ...town,
    coordinators: 1 + (town.name.charCodeAt(0) % 3),
    opportunities: (town.name.charCodeAt(0) % 10) + 3,
    signals: (town.name.charCodeAt(0) % 20) + 5,
  }));
  
  if (loading) {
    return (
      <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          <p className="text-muted-foreground">Loading towns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-ubuntu-light mb-4">
            Enter Ubuntu Town
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select a town to see its digital twin: opportunities, businesses, services, signals, and AI support.
          </p>
        </div>

        {/* Province Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {provinceNames.map((name) => {
            const href = name === 'All' ? '/towns' : `/towns?province=${name.toLowerCase().replace(' ', '-')}`;
            const isActive = (name === 'All' && !province) || 
                             (name !== 'All' && searchParams.get('province') === name.toLowerCase().replace(' ', '-'));
            return (
              <Link
                key={name}
                href={href}
                className={`px-4 py-2 border rounded-full text-sm transition-colors ${
                  isActive
                    ? 'bg-emerald-600 border-emerald-600 text-white font-bold'
                    : 'bg-ubuntu-card border-ubuntu-border hover:border-emerald-500 hover:text-emerald-400'
                }`}
              >
                {name}
              </Link>
            );
          })}
        </div>

        {/* Results count */}
        <div className="text-center text-sm text-muted-foreground mb-6">
          Showing {townsWithUI.length} of {townData.length} towns{province ? ` in ${province.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase())}` : ''}
        </div>

        {/* Towns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {townsWithUI.map((town) => (
            <Link
              key={town.slug}
              href={`/town/${town.slug}`}
              className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 hover:border-emerald-500 transition-colors group"
            >
              <div className="flex items-start justify-between mb-4">
                <h2 className="text-xl font-bold text-ubuntu-light group-hover:text-emerald-400 transition-colors">
                  {town.name}
                </h2>
                <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">{getProvinceName(town.province_id, provinces)}</p>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>{town.coordinators}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-learning" />
                  <span>{town.opportunities}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Signal className="w-4 h-4 text-proof" />
                  <span>{town.signals}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Pop:</span>
                  <span>{town.population_estimate || 'N/A'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function TownsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light flex items-center justify-center">
        <p className="text-muted-foreground">Loading towns...</p>
      </div>
    }>
      <TownList />
    </Suspense>
  );
}
