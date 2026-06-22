'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';

export function HomeStats() {
  const [stats, setStats] = useState({ towns: 50, provinces: 9, opportunities: 158, coordinators: 53 });
  useEffect(() => {
    async function load() {
      const [t, c, o] = await Promise.all([
        supabase.from('towns').select('id'),
        supabase.from('coordinators').select('id'),
        supabase.from('opportunities').select('id'),
      ]);
      setStats({ towns: t.data?.length || 50, provinces: 9, opportunities: o.data?.length || 158, coordinators: c.data?.length || 53 });
    }
    load();
  }, []);
  return (
    <div className="max-w-[1200px] mx-auto px-6 -mt-12 relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 border border-ubuntu-border rounded-2xl overflow-hidden">
        {[
          { number: stats.towns, label: 'Towns Active' },
          { number: stats.provinces, label: 'Provinces' },
          { number: stats.opportunities, label: 'Opportunities' },
          { number: stats.coordinators, label: 'Coordinators' },
        ].map((stat) => (
          <div key={stat.label} className="bg-ubuntu-card p-7 text-center border-r border-b border-ubuntu-border last:border-r-0">
            <div className="text-3xl font-extrabold text-ubuntu-gold-dark">{stat.number}</div>
            <div className="text-[0.7rem] text-ubuntu-text-muted uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function TownCount() {
  const [count, setCount] = useState(50);
  useEffect(() => {
    supabase.from('towns').select('id').then(({ data }) => { if (data) setCount(data.length); });
  }, []);
  return <>{count} Towns Live</>;
}
