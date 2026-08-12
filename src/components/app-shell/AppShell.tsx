'use client';

/**
 * AppShell — the single frame every Ubuntu Town surface renders inside.
 *
 * One app, one identity, one town context. The shell owns the header, the town
 * context, the theme control and the bottom navigation; pages own their content
 * and nothing else. Adding a capability should never mean inventing new chrome.
 *
 * It deliberately does NOT gate access. If a person reaches a page they cannot
 * use, the database refuses the underlying read or write and the page shows a
 * human message. The shell's job is composition, not defence.
 */

import Link from 'next/link';
import { ArrowLeft, Bell } from 'lucide-react';
import { useActor } from '@/lib/capabilities/useActor';
import { describeAuthority } from '@/lib/capabilities/resolve';
import BottomNav from './BottomNav';
import { ThemeToggle } from '@/components/brand/theme-toggle';

export interface AppShellProps {
  title?: string;
  /** Renders a back affordance instead of the identity block. */
  backHref?: string;
  /** Hide the bottom navigation (sign-in, full-screen flows). */
  chromeless?: boolean;
  right?: React.ReactNode;
  children: React.ReactNode;
}

export default function AppShell({ title, backHref, chromeless, right, children }: AppShellProps) {
  const { actor, town, displayName, loading, signedIn } = useActor();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {backHref ? (
            <Link href={backHref} aria-label="Back" className="-ml-2 rounded-full p-2 text-muted-foreground">
              <ArrowLeft size={20} />
            </Link>
          ) : null}

          <div className="min-w-0 flex-1">
            {title ? (
              <h1 className="truncate text-[17px] font-bold tracking-tight">{title}</h1>
            ) : (
              <>
                <p className="truncate text-[17px] font-bold tracking-tight">
                  {loading ? 'Ubuntu Town' : displayName ? greeting(displayName) : 'Ubuntu Town'}
                </p>
                <p className="truncate text-[12px] text-muted-foreground">
                  {town ? town.name : signedIn === false ? 'Signed out' : describeAuthority(actor)}
                </p>
              </>
            )}
          </div>

          {right}

          <Link
            href="/workspace"
            aria-label="Notifications"
            className="rounded-full p-2 text-muted-foreground"
          >
            <Bell size={19} />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Bottom padding clears the fixed nav plus the gesture bar. */}
      <main className={chromeless ? '' : 'pb-[calc(84px+env(safe-area-inset-bottom))] md:pb-8'}>
        <div className="mx-auto max-w-2xl px-4 py-4">{children}</div>
      </main>

      {!chromeless && <BottomNav actor={actor} />}
    </div>
  );
}

function greeting(name: string): string {
  const h = new Date().getHours();
  const part = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return `${part}, ${name.split(' ')[0]}`;
}
