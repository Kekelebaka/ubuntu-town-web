// src/app/operate/layout.tsx — EXPERIENCE 003 shell: THE UBUNTU TOWN OPERATING SYSTEM.
// Worlds: TOWNS (Geography OS) · INITIATIVES (Portfolio OS) · PEOPLE (People & Capability OS) ·
// MY WORK (Personal execution OS) · CHIEF OF STAFF (operating layer, everywhere).
// Public build: read-only, legitimate data only, contradictions marked, nothing fabricated.

import Link from 'next/link';
import { OSFooter } from '@/components/e003/shell';

export const metadata = {
  title: 'Ubuntu Town OS — The Operating System',
  description: 'The place where Ubuntu Town gets operated. See your world, understand what matters, do the work.',
};

const NAV = [
  { label: 'Home', href: '/operate' },
  { label: 'Towns', href: '/operate/national' },
  { label: 'Initiatives', href: '/operate/initiatives' },
  { label: 'People', href: '/operate/people' },
  { label: 'My Work', href: '/operate/work' },
  { label: 'Admin', href: '/operate/admin' },
];

export default function OperateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAF5EE] text-[#241A33]">
      <div className="bg-[#241A33] px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-[#E9DDF5]">
        Experience 003 · The Ubuntu Town Operating System · Blueprint is portfolio authority · Supabase is operational truth · nothing fabricated
      </div>
      <header className="sticky top-0 z-30 border-b border-[#EADFD2] bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
          <Link href="/operate" className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#241A33] text-sm font-black text-white">UT</span>
            <span>
              <span className="block text-sm font-bold leading-none text-[#241A33]">UBUNTU TOWN OS</span>
              <span className="block text-[10px] uppercase tracking-[0.16em] text-[#8A5410]">The place where Ubuntu Town gets operated</span>
            </span>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-xs font-semibold" aria-label="Operating worlds">
            {NAV.map((l) => (
              <Link key={l.href} href={l.href}
                className="rounded-full px-3.5 py-1.5 text-[#5B2A86] hover:bg-[#F3EBFA]">{l.label}</Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
      <div className="mx-auto max-w-7xl px-6 pb-12"><OSFooter /></div>
    </div>
  );
}
