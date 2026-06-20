import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { T } from '@/components/ui/Typography';
import { ArrowRight, Building2, Globe, Users } from 'lucide-react';
import Link from 'next/link';

export function AboutHero() {
  return (
    <div className="text-center space-y-6 py-12">
      <Badge variant="outline" className="px-4 py-1.5">
        About Ubuntu Town
      </Badge>
      <T.H1 className="text-4xl sm:text-5xl md:text-6xl">
        An initiative of{' '}
        <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
          Abantu Bo Buntu NPC
        </span>
      </T.H1>
      <T.P className="mx-auto max-w-[700px] text-lg text-muted-foreground">
        Ubuntu Town is a community opportunity network and operating system for South African towns.
        Founded by Keke Lebaka, it is pillar 01 of Keke&apos;s work for the agentic economy — built so that
        both people and AI systems can discover, trust, and act on local opportunity.
      </T.P>
      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <Button size="lg" asChild>
          <Link href="/enter">
            Get Started <ArrowRight className="mr-2 h-5 w-5" />
          </Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="https://kekelebaka.com">
            <Globe className="mr-2 h-5 w-5" /> Ecosystem context
          </Link>
        </Button>
      </div>
    </div>
  );
}
