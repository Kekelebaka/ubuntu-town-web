'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MapPin, Users, Briefcase, Signal, Sparkles, BookOpen, Store, Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';

interface Town {
  id: string;
  name: string;
  slug: string;
  province_id: string;
  coordinators?: number;
  opportunities?: number;
}

interface Province {
  id: string;
  name: string;
  slug: string;
}

const purposes = [
  { icon: Briefcase, title: 'I need work', desc: 'Find jobs, internships, bursaries, and tenders in your town.', color: 'text-learning' },
  { icon: Users, title: 'I need a CV', desc: 'Create and improve your CV with AI assistance.', color: 'text-ubuntu-purple' },
  { icon: Store, title: 'I own a business', desc: 'List your business, get verified, reach customers.', color: 'text-kasibuy' },
  { icon: Sparkles, title: 'I want to become coordinator', desc: 'Lead your town, manage opportunities, earn.', color: 'text-emerald-500' },
  { icon: Signal, title: 'I need local services', desc: 'Find plumbers, electricians, tutors, and FixEasy24.', color: 'text-fixeasy' },
  { icon: BookOpen, title: 'I want to support my town', desc: 'Sponsor projects, list opportunities, verify access.', color: 'text-proof' },
];

export default function EnterPage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [coordinatorsCount, setCoordinatorsCount] = useState(0);
  const [opportunitiesCount, setOpportunitiesCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: provincesData } = await supabase
          .from('provinces')
          .select('*');
        
        const { data: townsData } = await supabase
          .from('towns')
          .select('*');

        if (provincesData) {
          setProvinces(provincesData);
        }
        
        if (townsData) {
          setTowns(townsData);
          const totalCoordinators = townsData.reduce((sum, t) => sum + (t.coordinators || 0), 0);
          const totalOpportunities = townsData.reduce((sum, t) => sum + (t.opportunities || 0), 0);
          setCoordinatorsCount(totalCoordinators);
          setOpportunitiesCount(totalOpportunities);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ubuntu-dark text-ubuntu-light">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-ubuntu-dark/80 to-ubuntu-purple/20"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="w-6 h-6 text-emerald-500 animate-pulse" />
            <span className="text-sm text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">Live</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-ubuntu-light mb-6">
            Ubuntu Town
          </h1>
          <p className="text-xl md:text-2xl mb-8">
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              One Town. Many Hands. Real Opportunities.
            </span>
          </p>
          <Link
            href="/towns"
            className="inline-block px-8 py-4 bg-emerald-600 text-ubuntu-dark font-bold rounded-xl hover:bg-emerald-700 transition-colors text-lg"
          >
            Enter Ubuntu Town →
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-emerald-500">{provinces.length}</p>
            <p className="text-sm text-muted-foreground">Provinces</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-learning">{towns.length}</p>
            <p className="text-sm text-muted-foreground">Towns</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-ubuntu-purple">{coordinatorsCount}</p>
            <p className="text-sm text-muted-foreground">Coordinators</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-proof">{opportunitiesCount}</p>
            <p className="text-sm text-muted-foreground">Opportunities</p>
          </div>
        </div>
      </div>

      {/* Purpose Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-ubuntu-light mb-4">
            What do you need?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose your purpose and we'll guide you to the right town resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purposes.map((purpose, i) => (
            <Link
              key={i}
              href="/towns"
              className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 hover:border-emerald-500 transition-colors group"
            >
              <purpose.icon className={`w-12 h-12 ${purpose.color} mb-4`} />
              <h3 className="text-xl font-bold text-ubuntu-light mb-2 group-hover:text-emerald-400 transition-colors">
                {purpose.title}
              </h3>
              <p className="text-muted-foreground text-sm">
                {purpose.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Towns by Province */}
      <div className="max-w-7xl mx-auto px-4 py-16 bg-ubuntu-card/50 border-t border-ubuntu-border">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-ubuntu-light mb-4">
            Select a Province
          </h2>
          <p className="text-muted-foreground">
            Browse {towns.length} towns across {provinces.length} provinces and find your digital twin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {provinces.map((province) => {
            const provinceTowns = towns.filter(t => t.province_id === province.id);
            return (
              <Link
                key={province.slug}
                href={`/towns?province=${province.slug}`}
                className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 hover:border-emerald-500 transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-ubuntu-light group-hover:text-emerald-400 transition-colors">
                    {province.name}
                  </h3>
                  <span className="text-xs bg-ubuntu-dark text-muted-foreground px-2 py-1 rounded-full">
                    {provinceTowns.length} towns
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {provinceTowns.slice(0, 5).map((town) => (
                    <span
                      key={town.slug}
                      className="text-xs bg-ubuntu-dark border border-ubuntu-border rounded-full px-3 py-1 text-muted-foreground"
                    >
                      {town.name}
                    </span>
                  ))}
                  {provinceTowns.length > 5 && (
                    <span className="text-xs text-emerald-400">
                      +{provinceTowns.length - 5} more
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
