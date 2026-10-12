import { describe, it, expect } from 'vitest';
import { decideAdminAccess } from '../lib/admin-gate';

// ============================================================
// ADMIN SERVER ENFORCEMENT — NEGATIVE TESTS
// The decision behind /admin and /admin/fellowship (src/lib/admin-gate.ts,
// consumed by both server pages). Authority source: uto.is_hq() ==
// app.is_national() — admin or ops role assignment with town_id IS NULL
// (supabase/migrations/0005_hq_dashboard.sql). Fail closed: anything but an
// explicit `true` is a denial.
// ============================================================

const ADMIN_USER = { id: 'user-1' };

const HQ_PATHS = ['/admin', '/admin/fellowship'];

describe('admin gate — negative cases deny', () => {
  it.each(HQ_PATHS)('%s: unauthenticated visitor is denied', (pathname) => {
    const decision = decideAdminAccess({
      user: null,
      isHq: false,
      pathname,
    });
    expect(decision.allowed).toBe(false);
    if (decision.allowed) throw new Error('unreachable');
    expect(decision.redirectTo).toBe(
      `/login?next=${encodeURIComponent(pathname)}`
    );
  });

  it.each(HQ_PATHS)('%s: signed-in non-HQ user is denied', (pathname) => {
    const decision = decideAdminAccess({
      user: ADMIN_USER,
      isHq: false, // coordinator / deputy / town-scoped role — not national
      pathname,
    });
    expect(decision.allowed).toBe(false);
    if (decision.allowed) throw new Error('unreachable');
    expect(decision.redirectTo).toBe('/workspace');
  });

  it.each(HQ_PATHS)(
    '%s: RPC error is a denial, never a pass (fail closed)',
    (pathname) => {
      const decision = decideAdminAccess({
        user: ADMIN_USER,
        isHq: true, // even a claimed true cannot overrule a failed check
        rpcErrored: true,
        pathname,
      });
      expect(decision.allowed).toBe(false);
      if (decision.allowed) throw new Error('unreachable');
      expect(decision.redirectTo).toBe('/workspace');
    }
  );

  it.each([null, undefined, 0, 1, 'true', 'yes', {}])(
    'isHq=%s (not strictly true) is denied',
    (isHq) => {
      const decision = decideAdminAccess({
        user: ADMIN_USER,
        isHq: isHq as boolean | null | undefined,
        pathname: '/admin',
      });
      expect(decision.allowed).toBe(false);
    }
  );

  it('missing user object (undefined) is denied', () => {
    const decision = decideAdminAccess({
      user: undefined,
      isHq: true,
      pathname: '/admin',
    });
    expect(decision.allowed).toBe(false);
  });
});

describe('admin gate — HQ pass-through', () => {
  it.each(HQ_PATHS)('%s: national admin/ops is allowed', (pathname) => {
    const decision = decideAdminAccess({
      user: ADMIN_USER,
      isHq: true,
      pathname,
    });
    expect(decision.allowed).toBe(true);
  });
});
