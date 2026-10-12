// src/app/os/layout.tsx — EXPERIENCE 001 shell. Public (allowlisted in route-guard).
// ⚠ SYNTHETIC DEMO ENVIRONMENT — clearly labelled on every page.

import Link from 'next/link';
import { DemoBanner, Footer } from '@/components/experience/ui';

export const metadata = {
  title: 'Ubuntu Town OS — Experience 001',
  description: 'Build the person. Build the initiative. Build the town. Synthetic demo experience.',
};

export default function OsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF5EE] text-[#241A33]">
      <DemoBanner />
      <header className="border-b border-[#EADFD2] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/os" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B2A86] text-sm font-black text-white">UT</span>
            <span>
              <span className="block text-sm font-bold leading-none text-[#241A33]">UBUNTU TOWN OS</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#B2600E]">The town is moving</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-xs font-semibold">
            {[
              { label: 'National', href: '/os/national' },
              { label: 'Provinces', href: '/os/national#provinces' },
              { label: 'Senekal', href: '/os/town/senekal' },
              { label: 'FixEasy', href: '/os/initiative/syn-init-fixeasy-senekal' },
              { label: 'People', href: '/os/town/senekal#people' },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="rounded-full px-3 py-1.5 text-[#5B2A86] hover:bg-[#F3EBFA]">{l.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <div className="mx-auto max-w-6xl px-6 pb-12"><Footer /></div>
    </div>
  );
}
