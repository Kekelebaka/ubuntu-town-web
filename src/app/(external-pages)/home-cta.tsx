import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function HomeCTA() {
  return (
    <section className="py-20 px-4 text-center bg-gradient-to-b from-transparent to-muted/20">
      <div className="max-w-xl mx-auto flex flex-col gap-4 items-center">
        <h2 className="text-3xl font-bold tracking-tight">Ready to make your town visible?</h2>
        <p className="text-muted-foreground text-center max-w-lg">
          Whether you're an individual looking for work, a business mapping demand, a coordinator activating a town,
          or a sponsor funding real infrastructure — there's a place for you.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/enter">
              Enter the network <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/about">About Ubuntu Town</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
