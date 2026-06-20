import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Target, Users, Zap, CheckCircle2, AlertCircle, Rocket, Info } from 'lucide-react';
import Link from 'next/link';

interface MetricCard {
  live?: string | number;
  liveNote?: string;
  target: number | string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  percentage?: string;
  color: string;
}

interface LiveStatus {
  name: string;
  status: 'Live' | 'In Build' | 'Pilot' | 'Concept';
}

export function NationalActivationPipeline() {
  const liveMetrics: MetricCard[] = [
    {
      live: '22',
      target: 50,
      label: 'Towns active, with trained local ambassadors',
      icon: Users,
      percentage: '44%',
      color: 'from-emerald-500/20 to-emerald-500/5',
    },
    {
      live: '45+',
      target: 500,
      label: 'Ambassadors trained and coordinating',
      icon: Sparkles,
      color: 'from-amber-500/20 to-amber-500/5',
    },
  ];

  const targets: MetricCard[] = [
    {
      target: 50,
      label: 'Towns activated',
      icon: Target,
      color: 'from-emerald-500/20 to-emerald-500/5',
    },
    {
      target: 9,
      label: 'Provinces',
      icon: Rocket,
      color: 'from-blue-500/20 to-blue-500/5',
    },
    {
      target: '10,000+',
      label: 'Town signals captured',
      icon: Zap,
      color: 'from-violet-500/20 to-violet-500/5',
    },
    {
      target: '50,000+',
      label: 'Opportunities surfaced',
      icon: Sparkles,
      color: 'from-pink-500/20 to-pink-500/5',
    },
    {
      target: '500+',
      label: 'Coordinators supported',
      icon: Users,
      color: 'from-cyan-500/20 to-cyan-500/5',
    },
    {
      target: '5,000+',
      label: 'Workpacks launched',
      icon: Target,
      color: 'from-orange-500/20 to-orange-500/5',
    },
  ];

  const liveSystems: LiveStatus[] = [
    { name: 'CV Engine', status: 'Live' },
    { name: 'Ubuntu Academy', status: 'Live' },
    { name: 'Kopano assistant', status: 'In Build' },
    { name: 'Workpacks', status: 'Concept' },
  ];

  return (
    <section id="towns" className="py-20 px-4 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="max-w-6xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <Badge variant="outline" className="px-4 py-1.5 text-sm">
            National Activation Pipeline
          </Badge>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Where Ubuntu Town is today —
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
              and where it's going
            </span>
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            We label things exactly as they are. These are the numbers operating on the ground right now,
            shown next to our 2026 activation targets. Honest counters are the proof — it's how a town
            network earns trust from people and machines alike.
          </p>
        </div>

        {/* Live Now */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-lg font-semibold tracking-wide uppercase text-muted-foreground">
              Live now · June 2026
            </h3>
          </div>
          <p className="text-muted-foreground">Operating on the ground.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {liveMetrics.map((m) => (
              <div
                key={m.label}
                className="group relative overflow-hidden rounded-2xl border bg-gradient-to-br from-card to-muted/30 p-8 space-y-4"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative space-y-2">
                  <m.icon className="h-8 w-8 text-emerald-400" />
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold tracking-tight">{m.live}</span>
                    {m.percentage && (
                      <span className="text-sm font-medium text-muted-foreground">
                        of {m.target}
                      </span>
                    )}
                  </div>
                  {m.percentage && (
                    <div className="text-sm text-muted-foreground">{m.percentage} of the 2026 target</div>
                  )}
                  <p className="text-sm text-muted-foreground">{m.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Systems Running Today */}
          <div className="rounded-xl border bg-muted/20 p-6 space-y-3">
            <h4 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Systems running today
            </h4>
            <div className="flex flex-wrap gap-4">
              {liveSystems.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-2 text-sm"
                >
                  {s.status === 'Live' && (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-emerald-400">Live</span>
                      <span className="text-muted-foreground">
                        {s.name}
                      </span>
                    </>
                  )}
                  {s.status === 'In Build' && (
                    <>
                      <span className="inline-flex h-2 w-2 rounded-full bg-amber-500" />
                      <span className="text-amber-400">In build</span>
                      <span className="text-muted-foreground">
                        {s.name}
                      </span>
                    </>
                  )}
                  {s.status === 'Concept' && (
                    <>
                      <AlertCircle className="h-3 w-3 text-muted-foreground" />
                      <span className="text-muted-foreground">Pilot scoping</span>
                      <span className="text-muted-foreground">
                        {s.name}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2026 Targets */}
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold tracking-wide uppercase text-muted-foreground">
              2026 Target
            </h3>
          </div>
          <p className="text-muted-foreground">Where we're going.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {targets.map((t) => (
              <div
                key={t.label}
                className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card to-muted/20 p-6 hover:border-primary/30 transition-colors duration-300"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${t.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative space-y-2">
                  <t.icon className="h-5 w-5 text-muted-foreground group-hover:text-emerald-400 transition-colors" />
                  <div className="text-3xl font-bold tracking-tight">{t.target}</div>
                  <p className="text-sm text-muted-foreground">{t.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <div className="flex items-start gap-3 rounded-xl border bg-muted/20 p-5">
          <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              Live figures are what's verified on the ground today; 2026 figures are activation targets
              we're building toward.
            </p>
            <p>
              Detailed, honest status of every Ubuntu Town system:{' '}
              <Link
                href="https://kekelebaka.com/proof"
                className="text-primary hover:underline"
              >
                kekelebaka.com/proof
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
