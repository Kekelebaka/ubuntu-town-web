"use client";

import { useState, useEffect } from 'react';
import { MotionDiv } from '@/components/MotionDiv';
import { useTownContext } from '@/contexts/town-context';
import { Check, Brain, Calendar, AlertTriangle, MapPin, ChevronRight } from 'lucide-react';

export default function TownHome({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until client-side hydration is complete
  if (!mounted) {
    return null;
  }

  return (
    <Div>
      <TownHeader />
      <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-light text-white mb-6">Where Am I?</h2>
          <p className="text-xl font-light text-gray-200 mb-8">
            Ubuntu Town field OS for Mafikeng
          </p>

          <Grid>
            <StatCard icon={<MapPin />} label="Town" value="Mafikeng" />
            <StatCard icon={<Brain />} label="Opportunities" value="24 in your town" />
            <StatCard icon={<Calendar />} label="Recent Activity" value="3 today" />
          </Grid>

          <h2 className="text-2xl font-light text-white mb-6">What Happened Today?</h2>
          <RecentActivity />
          <h2 className="text-2xl font-light text-white mb-6">What Needs Attention?</h2>
          <Alerts />
          <h2 className="text-2xl font-light text-white mb-6">What Can I Do?</h2>
          <Actions />
      </div>
    </Div>
  );
}

function TownHeader() {
  const ctx = useTownContext();
  if (!ctx) throw new Error('useTownContext not available');
  const { townDisplayName } = ctx;
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="px-4 py-3">
        <h1 className="text-xl font-light text-white">{townDisplayName}</h1>
      </div>
    </header>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-lg p-4 min-w-[160px]"
    >
      <div className="flex items-center gap-2 mb-2 text-gray-400">
        {icon}
        <span className="text-sm font-light">{label}</span>
      </div>
      <p className="text-lg font-light text-white">{value}</p>
    </MotionDiv>
  );
}

function Alerts() {
  return (
    <ul className="space-y-3 mb-8">
      {[
        {
          icon: <AlertTriangle className="text-yellow-500" />,
          label: 'Proof awaiting your review',
          count: 2,
        },
        {
          icon: <Check className="text-green-500" />,
          label: 'Work in review',
          count: 1,
        },
      ].map((item, i) => (
        <MotionDiv key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="bg-gray-800/50 rounded-lg p-4 flex items-center gap-4">
            {item.icon}
            <div className="flex-1">
              <p className="text-white font-light">{item.label}</p>
              <p className="text-gray-400 text-sm">{item.count} items</p>
            </div>
          </div>
        </MotionDiv>
      ))}
    </ul>
  );
}

function Actions() {
  return (
    <div className="space-y-3 mb-8">
      <div>
        <a href="/work" className="block bg-gray-800/50 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700/50 transition-colors">
          <span className="text-white font-light">Available Work</span>
          <ChevronRight className="text-gray-400" />
        </a>
      </div>
      <div>
        <a href="/work/new" className="block bg-gray-800/50 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700/50 transition-colors">
          <span className="text-white font-light">Start Work</span>
          <ChevronRight className="text-gray-400" />
        </a>
      </div>
      <div>
        <a href="/work/submit" className="block bg-gray-800/50 rounded-lg p-4 flex items-center gap-4 hover:bg-gray-700/50 transition-colors">
          <span className="text-white font-light">Submit Proof</span>
          <ChevronRight className="text-gray-400" />
        </a>
      </div>
    </div>
  );
}


function RecentActivity() {
  const activities = [
    "Proof submitted by Nakita Jaub -铲除杂草 arranged 2024‑09‑24",
    "Work approved by Coordinator - construction request 2024‑09‑23",
    "New opportunity posted - 机械钻探 skills need 2024‑09‑22",
  ];
  return (
    <ul className="space-y-3 mb-8">
      {activities.map((activity, i) => (
        <MotionDiv key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <li className="bg-gray-800/50 rounded-lg p-4 border-l-2 border-gray-600 pl-4">
            <p className="text-white font-light">{activity}</p>
          </li>
        </MotionDiv>
      ))}
    </ul>
  );
}

const Grid = ({ children }: { children: React.ReactNode }) => <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">{children}</div>;

const Div = ({ children }: { children: React.ReactNode }) => (
  <div className="pt-20 pb-12">
    {children}
  </div>
);