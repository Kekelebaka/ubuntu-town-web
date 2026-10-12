// src/app/real/layout.tsx — EXPERIENCE 002 shell: "THE REAL TOWN OPERATING SYSTEM".
// Public (explicit allowlist edit in route-guard). Real data, read-only, honest limits.

import Link from 'next/link';
import { E002Footer } from '@/components/e002/ui';

export const metadata = {
  title: 'Ubuntu Town OS — Experience 002: The Real Town Operating System',
  description: 'Real canonical geography of the Ubuntu Town network. What we can see, what we cannot yet see, and why.',
};

export default function RealLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF5EE] text-[#241A33]">
      <div className="bg-[#241A33] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9DDF5]">
        Experience 002 · Real canonical data — read-only · Operational layers protected and shown honestly
      </div>
      <header className="border-b border-[#EADFD2] bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/real" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#241A33] text-sm font-black text-white">UT</span>
            <span>
              <span className="block text-sm font-bold leading-none text-[#241A33]">UBUNTU TOWN OS</span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-[#2F7D5C]">The real operating picture</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-xs font-semibold">
            {[
              { label: 'South Africa', href: '/real' },
              { label: 'Provinces', href: '/real#provinces' },
              { label: 'Coverage', href: '/real#coverage' },
              { label: 'Senekal', href: '/real/town/senekal' },
            ].map((l) => (
              <Link key={l.href} href={l.href}
                className="rounded-full px-3 py-1.5 text-[#5B2A86] hover:bg-[#F3EBFA]">{l.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      <div className="mx-auto max-w-6xl px-6 pb-12"><E002Footer /></div>
    </div>
  );
}
