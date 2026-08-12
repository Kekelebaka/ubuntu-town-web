'use client';

/**
 * Ubuntu Town bottom navigation — TODAY · TOWN · (+) · WORK · MORE
 *
 * The centre (+) is a universal ACTION, not a destination. It opens a sheet of
 * the things this person can actually do right now, composed from the
 * capability registry rather than from role checks scattered through JSX.
 *
 * Phone-first: 44px minimum tap targets, safe-area inset padding for gesture
 * bars, and no hover-dependent affordances.
 */

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, MapPin, Briefcase, LayoutGrid, Plus, X } from 'lucide-react';
import { capabilitiesForSurface } from '@/lib/capabilities/resolve';
import type { ActorContext } from '@/lib/capabilities/resolve';
import type { Capability } from '@/config/capabilities';

const TABS = [
  { key: 'today', label: 'Today', href: '/workspace', icon: Home, match: (p: string) => p === '/workspace' },
  { key: 'town', label: 'Town', href: '/towns', icon: MapPin, match: (p: string) => p.startsWith('/town') },
  { key: 'work', label: 'Work', href: '/workspace/review', icon: Briefcase, match: (p: string) => p.startsWith('/workspace/work') || p.startsWith('/workspace/review') || p.startsWith('/workspace/new') },
  { key: 'more', label: 'More', href: '#more', icon: LayoutGrid, match: () => false },
];

export default function BottomNav({ actor }: { actor: ActorContext }) {
  const pathname = usePathname() ?? '';
  const router = useRouter();
  const [sheet, setSheet] = useState<null | 'action' | 'more'>(null);

  const actions = capabilitiesForSurface(actor, 'universal_action');
  const more = capabilitiesForSurface(actor, 'more');

  function go(c: Capability) {
    setSheet(null);
    if (c.comingSoon || !c.route) return;
    router.push(c.route);
  }

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur
                   pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto flex max-w-2xl items-stretch justify-between px-2">
          {TABS.slice(0, 2).map(t => <Tab key={t.key} tab={t} pathname={pathname} onMore={() => setSheet('more')} />)}

          <li className="flex items-center">
            <button
              onClick={() => setSheet(sheet === 'action' ? null : 'action')}
              aria-label="Quick actions"
              aria-expanded={sheet === 'action'}
              className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-ubuntu-purple
                         text-white shadow-lg shadow-ubuntu-purple/25 transition-transform
                         active:scale-95 motion-reduce:transition-none"
            >
              <Plus size={26} strokeWidth={2.5} className={sheet === 'action' ? 'rotate-45 transition-transform' : 'transition-transform'} />
            </button>
          </li>

          {TABS.slice(2).map(t => <Tab key={t.key} tab={t} pathname={pathname} onMore={() => setSheet('more')} />)}
        </ul>
      </nav>

      {sheet && (
        <Sheet
          title={sheet === 'action' ? 'What do you want to do?' : 'More'}
          onClose={() => setSheet(null)}
          items={sheet === 'action' ? actions : more}
          onPick={go}
          emptyCopy={
            sheet === 'action'
              ? 'No actions available in this town yet.'
              : 'Nothing more to show yet.'
          }
        />
      )}
    </>
  );
}

function Tab({
  tab, pathname, onMore,
}: {
  tab: (typeof TABS)[number];
  pathname: string;
  onMore: () => void;
}) {
  const active = tab.match(pathname);
  const Icon = tab.icon;
  const cls = `flex min-h-[56px] w-full flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-semibold
               ${active ? 'text-ubuntu-purple' : 'text-muted-foreground'}`;

  if (tab.key === 'more') {
    return (
      <li className="flex-1">
        <button onClick={onMore} className={cls} aria-label="More">
          <Icon size={20} strokeWidth={active ? 2.4 : 2} />
          {tab.label}
        </button>
      </li>
    );
  }
  return (
    <li className="flex-1">
      <Link href={tab.href} className={cls} aria-current={active ? 'page' : undefined}>
        <Icon size={20} strokeWidth={active ? 2.4 : 2} />
        {tab.label}
      </Link>
    </li>
  );
}

function Sheet({
  title, items, onClose, onPick, emptyCopy,
}: {
  title: string;
  items: Capability[];
  onClose: () => void;
  onPick: (c: Capability) => void;
  emptyCopy: string;
}) {
  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 bg-black/40" aria-label="Close" onClick={onClose} />
      <div
        className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-3xl border-t
                   border-border bg-card pb-[calc(env(safe-area-inset-bottom)+16px)] shadow-2xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-4">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 text-muted-foreground">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">{emptyCopy}</p>
        )}

        <ul className="p-3">
          {items.map(c => {
            const Icon = c.icon;
            return (
              <li key={c.key}>
                <button
                  onClick={() => onPick(c)}
                  disabled={c.comingSoon}
                  className="flex w-full items-center gap-4 rounded-2xl px-3 py-3 text-left
                             disabled:opacity-45 active:bg-accent motion-reduce:transition-none"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-ubuntu-purple">
                    <Icon size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-foreground">{c.name}</span>
                    <span className="block truncate text-[13px] text-muted-foreground">{c.description}</span>
                  </span>
                  {c.comingSoon && (
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Soon
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
