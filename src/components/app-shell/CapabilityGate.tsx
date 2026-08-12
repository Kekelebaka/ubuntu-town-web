'use client';

/**
 * CapabilityGate — conditionally render a surface for a capability.
 *
 *   <CapabilityGate capability="work.review">
 *     <ReviewButton />
 *   </CapabilityGate>
 *
 * READ THIS BEFORE USING IT.
 *
 * This is a presentation gate. It hides things that would only lead to a
 * refusal; it does not protect anything. Never place data inside it that the
 * database would otherwise hand out — if the row must not be seen, that is a
 * row-level security policy, not a React component.
 *
 * The correct mental model:
 *   CapabilityGate  -> "don't waste their time"
 *   RLS / app.*     -> "don't let them"
 */

import { useActor } from '@/lib/capabilities/useActor';
import { can } from '@/lib/capabilities/resolve';

export default function CapabilityGate({
  capability,
  children,
  fallback = null,
  /** Render nothing at all while authority is still loading (default). */
  showWhileLoading = false,
}: {
  capability: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showWhileLoading?: boolean;
}) {
  const { actor, loading } = useActor();
  if (loading) return showWhileLoading ? <>{children}</> : null;
  return can(actor, capability) ? <>{children}</> : <>{fallback}</>;
}
