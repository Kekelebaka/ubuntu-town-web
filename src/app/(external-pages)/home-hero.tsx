import { ArrowRight, Hammer } from 'lucide-react';
import Link from 'next/link';

export function HomeHero() {
  return (
    <section className="flex flex-col items-center justify-center gap-6 py-16 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-6xl max-w-3xl">
        <span className="text-ubuntu-gold-dark">One Town.</span> Many Hands.
        <br />Real Opportunities.
      </h1>
      <p className="text-muted-foreground text-lg max-w-xl">
        Ubuntu Town makes whole towns legible to the opportunity economy.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link href="/enter" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-black" style={{ background: '#eeb849', color: '#070509' }}>
          Enter Your Town <ArrowRight className="h-4 w-4" />
        </Link>
        <a href="https://forge.ubuntutown.co.za" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold border" style={{ borderColor: 'rgba(238,184,73,0.5)', color: '#b98114' }}>
          <Hammer className="h-4 w-4" /> Kopano Forge
        </a>
      </div>
    </section>
  );
}
