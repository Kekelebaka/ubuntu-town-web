'use client';

/**
 * WorkspaceChrome — wraps every /workspace route in the persistent Ubuntu Town
 * app navigation shell.
 *
 * Mobile: BottomNav (fixed bottom, md:hidden)
 * Desktop: DesktopRail (fixed left sidebar, aubergine, hidden on mobile)
 */

import BottomNav from '@/components/app-shell/BottomNav';
import DesktopRail from '@/components/app-shell/DesktopRail';
import { useActor } from '@/lib/capabilities/useActor';

export default function WorkspaceChrome({ children }: { children: React.ReactNode }) {
  const { actor } = useActor();
  return (
    <>
      <DesktopRail />
      {/* Desktop: left margin for the rail. Mobile: bottom padding for BottomNav. */}
      <div className="pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0 md:ml-60">
        {children}
      </div>
      <BottomNav actor={actor} />
    </>
  );
}
