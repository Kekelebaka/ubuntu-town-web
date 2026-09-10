'use client';

/**
 * DesktopRail — deep aubergine vertical navigation rail for desktop.
 *
 * Shows on md+ screens. Hidden on mobile (BottomNav handles mobile).
 * Canonical navigation: TODAY · TOWN · DO · GROW · OPPORTUNITIES · PASSPORT
 * Plus KOPANO entry and user identity at the bottom.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Briefcase, TrendingUp, Target, IdCard, Sparkles, Bell } from 'lucide-react';
import { useActor } from '@/lib/capabilities/useActor';

const NAV_ITEMS = [
  { key: 'today', label: 'Today', href: '/workspace/today', icon: Home, match: (p: string) => p === '/workspace/today' || p === '/workspace' },
  { key: 'town', label: 'Town', href: '/workspace/town', icon: MapPin, match: (p: string) => p.startsWith('/workspace/town') },
  { key: 'do', label: 'Do', href: '/workspace/work', icon: Briefcase, match: (p: string) => p.startsWith('/workspace/work') || p.startsWith('/workspace/new') || p.startsWith('/workspace/missions') },
  { key: 'grow', label: 'Grow', href: '/workspace/grow', icon: TrendingUp, match: (p: string) => p.startsWith('/workspace/grow') },
  { key: 'opportunities', label: 'Opportunities', href: '/workspace/opportunities', icon: Target, match: (p: string) => p.startsWith('/workspace/opportunities') },
  { key: 'passport', label: 'Passport', href: '/workspace/passport', icon: IdCard, match: (p: string) => p.startsWith('/workspace/passport') },
];

export default function DesktopRail() {
  const pathname = usePathname() ?? '';
  const { actor, town, displayName } = useActor();

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 z-30 w-60 flex-col bg-[var(--ut-aubergine)] text-[var(--ut-cream)]">
      {/* Logo / Identity */}
      <div className="px-4 pt-5 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg font-black">
            UT
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold truncate">Ubuntu Town</div>
            {town && <div className="text-xs text-white/60 truncate">{town.name}</div>}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto">
        <ul className="space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.match(pathname);
            return (
              <li key={item.key}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors
                    ${active
                      ? 'bg-white/15 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                >
                  <Icon size={18} strokeWidth={active ? 2.4 : 2} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Review queue link for coordinators */}
        {actor.assignments.some(a => ['coordinator', 'deputy', 'admin', 'ops'].includes(a.role_key)) && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <Link
              href="/workspace/review"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors
                ${pathname.startsWith('/workspace/review')
                  ? 'bg-white/15 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
            >
              <Bell size={18} />
              Review Queue
            </Link>
          </div>
        )}
      </nav>

      {/* Kopano entry */}
      <div className="px-3 pb-2">
        <Link
          href="/workspace/today"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white transition-colors"
        >
          <Sparkles size={18} />
          Ask Kopano
        </Link>
      </div>

      {/* User identity */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--ut-orange)] flex items-center justify-center text-white text-xs font-bold">
            {displayName ? displayName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{displayName || 'Guest'}</div>
            <div className="text-xs text-white/50 truncate">
              {actor.assignments.length > 0
                ? actor.assignments.map(a => a.role_key).filter((v, i, a) => a.indexOf(v) === i).join(', ')
                : 'Member'}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
