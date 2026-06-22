import Link from 'next/link';
import { MapPinned, Users, Briefcase, Sparkles } from 'lucide-react';
import { getTownBySlug, getOpportunitiesForTown, getBusinessesForTown, getSignalsForTown, getCoordinatorsForTown, getMetricsForTown, type Town } from '@/lib/mock-data';

export const runtime = 'edge'
export const dynamic = 'force-dynamic';

export default async function TownPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const town = await getTownBySlug(slug);
  if (!town) {
    return (
      <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-ubuntu-orange mb-4">Town Not Found</h1>
          <p className="text-muted-foreground mb-6">No town found with that name.</p>
          <Link href="/towns" className="text-ubuntu-orange hover:underline">← Back to all towns</Link>
        </div>
      </div>
    );
  }
  const townNonNull = town as Town;
  const opportunities = await getOpportunitiesForTown(slug);
  const businesses = await getBusinessesForTown(slug);
  const signals = await getSignalsForTown(slug);
  const coordinators = await getCoordinatorsForTown(slug);
  const metrics = await getMetricsForTown(townNonNull.id);

  return (
    <div className="min-h-screen bg-ubuntu-cream text-ubuntu-text">
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-ubuntu-gold/10 to-ubuntu-orange/10 flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <MapPinned className="w-full h-full text-ubuntu-purple" />
        </div>
        <div className="text-center relative z-10 px-4">
          <h1 className="text-4xl md:text-6xl font-bold text-ubuntu-text mb-2">{townNonNull.name}</h1>
          <p className="text-ubuntu-orange text-lg md:text-xl">
            {townNonNull.archetype ? townNonNull.archetype.charAt(0).toUpperCase() + townNonNull.archetype.slice(1) : 'Town'} • Pop: {townNonNull.population_estimate || 'N/A'}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-ubuntu-orange" />
              <div>
                <p className="text-2xl font-bold text-ubuntu-text">{metrics?.active_coordinators || 0}</p>
                <p className="text-xs text-muted-foreground">Coordinators</p>
              </div>
            </div>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Briefcase className="w-8 h-8 text-learning" />
              <div>
                <p className="text-2xl font-bold text-ubuntu-text">{metrics?.open_opportunities || 0}</p>
                <p className="text-xs text-muted-foreground">Opportunities</p>
              </div>
            </div>
          </div>
          <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6 shadow-lg">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-ubuntu-purple" />
              <div>
                <p className="text-2xl font-bold text-ubuntu-text">{metrics?.youth_mapped || 0}</p>
                <p className="text-xs text-muted-foreground">Youth Mapped</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-ubuntu-text">Opportunity Board</h2>
                <span className="text-ubuntu-orange text-sm">{opportunities.length} available</span>
              </div>
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div key={opp.id} className="bg-white/60 border border-ubuntu-border rounded-lg p-4 hover:border-ubuntu-orange/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-ubuntu-text">{opp.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{opp.type || 'General'}</p>
                      </div>
                      <span className="text-xs bg-ubuntu-purple/20 text-ubuntu-purple px-2 py-1 rounded whitespace-nowrap ml-2">
                        {opp.deadline_date ? new Date(opp.deadline_date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' }) : 'Open'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-ubuntu-text">Signal Inbox</h2>
                <span className="text-ubuntu-orange text-sm">{signals.length} signals</span>
              </div>
              <div className="space-y-3">
                {signals.slice(0, 5).map((signal) => (
                  <div key={signal.id} className="bg-white/60 border border-ubuntu-border rounded-lg p-4 hover:border-ubuntu-orange/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-ubuntu-text text-sm">{signal.title}</h3>
                        <p className="text-xs text-muted-foreground capitalize">{signal.category}</p>
                      </div>
                      <span className="text-xs bg-ubuntu-purple/20 text-ubuntu-purple px-2 py-1 rounded">
                        {signal.status === 'pending' ? '⏳' : '✅'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/towns/all/signals" className="mt-4 block text-center text-ubuntu-orange text-sm hover:underline">Submit Signal →</Link>
            </div>
          </div>
          <div className="space-y-8">
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
              <h2 className="text-2xl font-bold text-ubuntu-text mb-4">Business Directory</h2>
              <div className="grid grid-cols-2 gap-4">
                {businesses.map((biz) => (
                  <div key={biz.id} className="bg-white/60 border border-ubuntu-border rounded-lg p-4 hover:border-ubuntu-orange/50 transition-colors">
                    <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${biz.category === 'kasibuy' ? 'bg-kasibuy/20 text-kasibuy' : biz.category === 'fixeasy24' ? 'bg-fixeasy/20 text-fixeasy' : 'bg-ubuntu-purple/20 text-ubuntu-purple'}`}>
                      <Briefcase className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-ubuntu-text">{biz.name}</p>
                    {biz.is_verified && <span className="text-xs text-learning">✓ Verified</span>}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-6 h-6 text-ubuntu-orange" />
                <h2 className="text-2xl font-bold text-ubuntu-text">AI Café</h2>
              </div>
              <p className="text-muted-foreground mb-4">Ask Kopano about opportunities, CV help, or town services.</p>
              <div className="bg-white/60 border border-ubuntu-border rounded-lg p-4">
                <div className="text-sm text-muted-foreground mb-2">Example:</div>
                <div className="bg-ubuntu-purple/10 border border-ubuntu-purple/30 rounded p-3">
                  <p className="text-ubuntu-purple">"Help me improve my CV for SAPS internship"</p>
                </div>
                <div className="mt-3 bg-ubuntu-border/20 rounded p-3 text-sm">
                  <p className="text-ubuntu-text">"Based on your CV, focus on: 1) Leadership experience 2) Technical skills 3) Community service. Would you like me to draft improvements?"</p>
                </div>
              </div>
            </div>
            <div className="bg-ubuntu-card border border-ubuntu-border rounded-xl p-6">
              <h2 className="text-2xl font-bold text-ubuntu-text mb-4">Town Coordinators</h2>
              <div className="space-y-2">
                {coordinators.map((coord) => (
                  <div key={coord.id} className="flex items-center gap-3 bg-white/60 border border-ubuntu-border rounded-lg p-3">
                    <div className="w-8 h-8 rounded-full bg-ubuntu-purple/20 flex items-center justify-center text-ubuntu-purple text-sm font-bold">{coord.display_name.charAt(0)}</div>
                    <div>
                      <p className="text-sm text-ubuntu-text">{coord.display_name}</p>
                      <p className="text-xs text-muted-foreground">{coord.status === 'active' ? '● Active' : '○ Inactive'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
