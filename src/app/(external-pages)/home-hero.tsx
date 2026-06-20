import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export function HomeHero() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
      <Badge variant="secondary" className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
        {'U &gt; I'} — The intelligence between us is the foundation
      </Badge>
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl max-w-3xl">
        <span className="bg-gradient-to-r from-emerald-400 to-emerald-600 bg-clip-text text-transparent">
          One Town.
        </span>{' '}
        Many Hands.
        <br />
        Real Opportunities.
      </h1>
      <p className="text-muted-foreground text-lg max-w-xl">
        Ubuntu Town makes whole towns legible to the opportunity economy. Build a CV, find nearby work,
        or activate a town. Built for the agentic economy — structured so people and AI systems can discover,
        trust, and act.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
          <Link href="/enter">
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="https://t.me/UIE_Kopano_bot" target="_blank" rel="noopener noreferrer">
            <MessageSquare className="mr-2 h-4 w-4" /> Telegram Bot
          </Link>
        </Button>
      </div>
    </section>
  );
}
