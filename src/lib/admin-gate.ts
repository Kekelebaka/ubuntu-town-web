/**
 * ADMIN GATE — the shared, testable decision behind the /admin routes.
 *
 * Thin wrapper over what src/app/admin/page.tsx already did:
 *   1. must be signed in (supabase.auth.getUser)
 *   2. must be HQ — uto.is_hq(), which is app.is_national(): an admin or ops
 *      role assignment with town_id IS NULL (supabase/migrations/0005_hq_dashboard.sql)
 *
 * Pure and import-free so vitest can exercise the exact code the server pages
 * run. This is NOT a new auth system: it reads the same database-backed
 * authority (role_assignments via uto.is_hq) that every other surface trusts.
 * Fail closed: anything other than an explicit `true` from is_hq() is a denial.
 */

import { loginRedirectFor } from './route-guard';

export interface AdminAccessInput {
  /** Result of supabase.auth.getUser() — null when unauthenticated. */
  user: { id: string } | null | undefined;
  /** Result of supabase.rpc('is_hq') — must be strictly true to pass. */
  isHq: boolean | null | undefined;
  /** Set when the is_hq RPC errored — an error is a denial, never a pass. */
  rpcErrored?: boolean;
  /** Request pathname, used to build the login redirect's next param. */
  pathname: string;
}

export type AdminAccessDecision =
  | { allowed: true }
  | { allowed: false; redirectTo: string };

export function decideAdminAccess(input: AdminAccessInput): AdminAccessDecision {
  if (!input.user) {
    return { allowed: false, redirectTo: loginRedirectFor(input.pathname) };
  }
  if (input.rpcErrored === true || input.isHq !== true) {
    return { allowed: false, redirectTo: '/workspace' };
  }
  return { allowed: true };
}
