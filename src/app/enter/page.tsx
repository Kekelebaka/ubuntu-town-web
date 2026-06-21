'use client';
import Link from 'next/link';
import { MapPin, Users, Briefcase, Signal, Sparkles, BookOpen, Store } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

interface Province { id: string; name: string; slug: string; }
interface Town { id: string; name: string; slug: string; province_id: string | null; }

const purposes = [
  { icon: Briefcase, title: 'I need work', desc: 'Find jobs, internships, bursaries, and tenders in your town.', color: 'text-ubuntu-gold-dark' },
  { icon: Users, title: 'I need a CV', desc: 'Create and improve your CV with AI assistance.', color: 'text-ubuntu-purple' },
  { icon: Store, title: 'I own a business', desc: 'List your business, get verified, reach customers.', color: 'text-kasibuy' },
  { icon: Sparkles, title: 'I want to become coordinator', desc: 'Lead your town, manage opportunities, earn.', color: 'text-ubuntu-orange' },
  { icon: Signal, title: 'I need local services', desc: 'Find plumbers, electricians, tutors, and FixEasy24.', color: 'text-fixeasy' },
  { icon: BookOpen, title: 'I want to support my town', desc: 'Sponsor projects, list opportunities, verify access.', color: 'text-proof' },
];

export default function EnterPage() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [towns, setTowns] = useState<Town[]>([]);
  const [stats, setStats] = useState({ provinces: 9, towns: 27, coordinators: 18, opportunities: 62 });

  useEffect(() => {
    async function load() {
      const [provRes, townRes, coordRes, oppRes] = await Promise.all([
        supabase.from('provinces').select('*').order('name'),
        supabase.from('towns').select('id,name,slug,province_id').order('name'),
        supabase.from('coordinators').select('id'),
        supabase.from('opportunities').select('id'),
      ]);
      if (provRes.data) setProvinces(provRes.data);
      if (townRes.data) setTowns(townRes.data);
      setStats({
        provinces: provRes.data?.length || 9,
        towns: townRes.data?.length || 27,
        coordinators: coordRes.data?.length || 18,
        opportunities: oppRes.data?.length || 62,
      });
    }
    load();
  }, []);

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      {/* Hero Section */}
      <div className="relative h-96 md:h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-ubuntu-gold/10 via-ubuntu-cream/80 to-ubuntu-gold/5"></div>
        <div className="relative z-10 text-center px-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ubuntu-gold/10 border border-ubuntu-gold/20 text-ubuntu-gold-dark text-sm mb-6">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-ubuntu-gold opacity-75"></span><span className="relative rounded-full h-2 w-2 bg-ubuntu-gold"></span></span>
            Live — {stats.towns} towns active
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            <span className="bg-gradient-to-r from-ubuntu-gold to-ubuntu-gold-dark bg-clip-text text-transparent">One Town.</span>{' '}
            Many Hands.
            <br />Real Opportunities.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Enter your town. Find what&apos;s possible. Build what&apos;s missing.
          </p>
          <Link
            href="/towns"
            className="inline-block px-8 py-4 bg-ubuntu-gold hover:bg-ubuntu-goldr gap-2 px-white font-bold rounded-xl transition-colors text-lg"
          >
            Enter Ubuntu Town →
          </Link>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-ubuntu-gold-dark">{stats.provinces}</p>
            <p className="text-sm text-muted-foreground">Provinces</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-ubuntu-gold-dark">{stats.towns}</p>
            <p className="text-sm text-muted-foreground">Towns</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-ubuntu-purple">{stats.coordinators}</p>
            <p className="text-sm text-muted-foreground">Coordinators</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-ubuntu-orange">{stats.opportunities}</p>
            <p className="text-sm text-muted-foreground">Opportunities</p>
          </div>
        </div>
      </div>

      {/* Purpose Section */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-ubuntu-text mb-4">What do you need?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose your purpose and we&apos;ll guide you to the right town resources.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {purposes.map((purpose, i) => (
            <Link
              key={i}
              href="/towns"
              className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 hover:border-ubuntu-gold transition-colors group"
            >
              <purpose.icon className={`w-12 h-12 ${purpose.color} mb-4`} />
              <h3 className="text-xl font-bold text-ubuntu-text mb-2 group-hover:text-ubuntu-gold-dark transition-colors">
                {purpose.title}
              </h3>
              <p className="text-muted-foreground text-sm">{purpose.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Towns by Province */}
      <div className="max-w-7xl mx-auto px-4 py-16 bg-ubuntu-card/50 border-t border-ubuntu-border">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-ubuntu-text mb-4">Select a Province</h2>
          <p className="text-muted-foreground">
            Browse {stats.towns} towns across {stats.provinces} provinces and find your digital twin.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {provinces.map((province) => {
            const provinceTowns = towns.filter(t => t.province_id === province.id);
            return (
              <Link
                key={province.slug}
                href={`/towns?province=${province.slug}`}
                className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 hover:border-ubuntu-gold transition-colors group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-ubuntu-text group-hover:text-ubuntu-gold-dark transition-colors">
                    {province.name}
                  </h3>
                  <span className="text-xs bg-ubuntu-gold/10 text-ubuntu-gold-dark px-2 py-1 rounded-full">
                    {provinceTowns.length} towns
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {provinceTowns.slice(0, 5).map((town) => (
                    <span
                      key={town.slug}
                      className="text-xs bg-ubuntu-cream border border-ubuntu-border rounded-full px-3 py-1 text-muted-foreground"
                    >
                      {town.name}
                    </span>
                  ))}
                  {provinceTowns.length > 5 && (
                    <span className="text-xs text-ubuntu-gold-dark">
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
