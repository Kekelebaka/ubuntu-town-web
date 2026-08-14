'use client';

/**
 * WorkspaceChrome — wraps every /workspace route in the persistent Ubuntu Town
 * app navigation (Today · Town · + · Work · More) with the universal + action
 * sheet.
 *
 * This is Phase 2, increment 1: make the workspace *feel* like one app without
 * disturbing the working Work Proof Loop pages. BottomNav is a fixed, mobile-
 * only (`md:hidden`) overlay, so it sits under each page's existing content and
 * chrome rather than replacing it. We only add bottom padding on mobile so page
 * content clears the bar. Header unification + token cleanup are increment 2.
 *
 * The nav is composed from the capability registry via the real signed-in
 * actor — it is presentation only; the database still decides every action.
 */

import BottomNav from '@/components/app-shell/BottomNav';
import { useActor } from '@/lib/capabilities/useActor';

export default function WorkspaceChrome({ children }: { children: React.ReactNode }) {
  const { actor } = useActor();
  return (
    <>
      {/* Clear the fixed bottom nav on mobile; desktop nav is hidden so no pad. */}
      <div className="pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </div>
      <BottomNav actor={actor} />
    </>
  );
}
