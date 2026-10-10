import { describe, it, expect } from 'vitest';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  decideRouteAccess,
  isPublicPath,
  requiresAuth,
  loginRedirectFor,
} from '../lib/route-guard';

// ============================================================
// ROUTE PROTECTION MATRIX TESTS
// Route x auth-state x expected redirect/allow, driven by the same
// src/lib/route-guard.ts module the middleware runs. The authoritative matrix
// (with role / tenant scope / enforcement evidence) lives in
// /home/ubuntu/ut-os-wave1/ROUTE_PROTECTION_MATRIX.md.
// ============================================================

interface MatrixRow {
  route: string;
  authRequired: boolean;
  role: string | null;
}

/** Every route in src/app: 35 pages + 2 API routes. */
export const ROUTE_MATRIX: MatrixRow[] = [
  // --- public: town directory & marketing ---
  { route: '/', authRequired: false, role: null },
  { route: '/about', authRequired: false, role: null },
  { route: '/towns', authRequired: false, role: null },
  { route: '/town/senekal', authRequired: false, role: null }, // /town/[slug]
  { route: '/province/free-state', authRequired: false, role: null }, // /province/[slug]
  { route: '/enter', authRequired: false, role: null },
  // --- public: application forms (insert-only, database-attributed) ---
  { route: '/apply', authRequired: false, role: null },
  { route: '/fellowship', authRequired: false, role: null },
  // --- public: auth plumbing ---
  { route: '/login', authRequired: false, role: null },
  { route: '/sign-up', authRequired: false, role: null },
  { route: '/forgot-password', authRequired: false, role: null },
  { route: '/auth/callback', authRequired: false, role: null },
  { route: '/auth/confirm', authRequired: false, role: null },
  { route: '/auth/recover', authRequired: false, role: null },
  { route: '/auth/auth-code-error', authRequired: false, role: null },
  // --- public: API (release provenance; revalidate is token-checked itself) ---
  { route: '/api/release', authRequired: false, role: null },
  { route: '/api/revalidate', authRequired: false, role: null },
  // --- protected: starter app surfaces ---
  { route: '/dashboard', authRequired: true, role: null },
  { route: '/dashboard/new', authRequired: true, role: null },
  { route: '/private-items', authRequired: true, role: null },
  { route: '/private-item/abc123', authRequired: true, role: null }, // /private-item/[privateItemId]
  { route: '/update-password', authRequired: true, role: null },
  // --- protected: operating system shell ---
  { route: '/workspace', authRequired: true, role: null },
  { route: '/workspace/new', authRequired: true, role: null },
  { route: '/workspace/people', authRequired: true, role: null },
  { route: '/workspace/review', authRequired: true, role: null },
  { route: '/workspace/today', authRequired: true, role: null },
  { route: '/workspace/town', authRequired: true, role: null },
  { route: '/workspace/work', authRequired: true, role: null },
  // --- protected: HQ admin (server role gate: uto.is_hq) ---
  { route: '/admin', authRequired: true, role: 'admin/ops (national)' },
  { route: '/admin/fellowship', authRequired: true, role: 'admin/ops (national)' },
  // --- protected: personal / role-adaptive surfaces ---
  { route: '/assignments', authRequired: true, role: null },
  { route: '/profile', authRequired: true, role: null },
  { route: '/chat', authRequired: true, role: null },
  { route: '/coordinator', authRequired: true, role: 'coordinator' },
  { route: '/cv', authRequired: true, role: null },
  { route: '/submit-signal', authRequired: true, role: null },
  { route: '/town-home', authRequired: true, role: null },
  { route: '/town-select', authRequired: true, role: null },
];

describe('route protection matrix — every route in src/app', () => {
  it('covers 35 pages + 2 /auth route handlers + 2 API routes', () => {
    // src/app contains 35 page.tsx files and 4 route.ts handlers:
    // /auth/callback, /auth/confirm (auth plumbing) and /api/release,
    // /api/revalidate (the "2 API routes").
    expect(ROUTE_MATRIX).toHaveLength(39);
    expect(ROUTE_MATRIX.filter((r) => r.route.startsWith('/api/'))).toHaveLength(2);
    expect(ROUTE_MATRIX.filter((r) => r.route.startsWith('/auth/'))).toHaveLength(4);
  });

  it('is complete: every page/route file in src/app appears in the matrix', () => {
    // The matrix cannot drift from the filesystem: derive every route from
    // src/app/**/{page,route}.tsx and require an exact matrix entry.
    const appDir = fileURLToPath(new URL('../app', import.meta.url));
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/^(page|route)\.tsx?$/.test(entry.name)) files.push(full);
      }
    };
    walk(appDir);

    const fsShapes = files.map((f) => {
      let rel = f.slice(appDir.length).replace(/\/(page|route)\.tsx?$/, '');
      rel = rel.replace(/\/\([^)]+\)/g, ''); // route groups are not URL segments
      return rel === '' ? '/' : rel;
    });

    // Matrix rows use representative segments for dynamic files; map back.
    const dynamicRepresentatives: Record<string, string> = {
      '/town/senekal': '/town/[slug]',
      '/province/free-state': '/province/[slug]',
      '/private-item/abc123': '/private-item/[privateItemId]',
    };
    const matrixShapes = ROUTE_MATRIX.map(
      (r) => dynamicRepresentatives[r.route] ?? r.route
    );

    expect([...fsShapes].sort()).toEqual([...matrixShapes].sort());
  });

  it.each(ROUTE_MATRIX.map((r) => [r.route, r] as const))(
    'anonymous: %s',
    (_route, row) => {
      const decision = decideRouteAccess(row.route, { isAuthenticated: false });
      if (row.authRequired) {
        expect(decision.allowed).toBe(false);
        expect(decision.redirectTo).toBe(
          `/login?next=${encodeURIComponent(row.route)}`
        );
      } else {
        expect(decision.allowed).toBe(true);
        expect(decision.redirectTo).toBeNull();
      }
    }
  );

  it.each(ROUTE_MATRIX.map((r) => [r.route, r] as const))(
    'authenticated: %s',
    (_route, row) => {
      const decision = decideRouteAccess(row.route, { isAuthenticated: true });
      expect(decision.allowed).toBe(true);
      expect(decision.redirectTo).toBeNull();
    }
  );
});

describe('fail closed — default deny for unknown/new routes', () => {
  it.each([
    '/brand-new-page',
    '/workspace/secret',
    '/admin/new-tool',
    '/api/new-endpoint',
    '/settings',
    '/anything/at/all',
  ])('new route %s is protected by default', (route) => {
    expect(requiresAuth(route)).toBe(true);
    const decision = decideRouteAccess(route, { isAuthenticated: false });
    expect(decision.allowed).toBe(false);
  });

  it('a route is public only through an explicit allowlist edit', () => {
    // Neighbours of public prefixes must NOT inherit publicness.
    expect(isPublicPath('/authx')).toBe(false); // '/auth' is segment-bounded
    expect(isPublicPath('/town-home')).toBe(false); // '/town' is segment-bounded
    expect(isPublicPath('/fellowships')).toBe(false);
    expect(isPublicPath('/about-us')).toBe(false);
    expect(isPublicPath('/province')).toBe(true); // the prefix itself
    expect(isPublicPath('/town')).toBe(true); // the prefix itself
  });

  it('/admin/fellowship is protected even though /fellowship is public', () => {
    expect(isPublicPath('/fellowship')).toBe(true);
    expect(isPublicPath('/admin/fellowship')).toBe(false);
  });
});

describe('login redirect contract', () => {
  it('redirects anonymous users to /login with a next param', () => {
    const decision = decideRouteAccess('/workspace', { isAuthenticated: false });
    expect(decision.redirectTo).toBe('/login?next=%2Fworkspace');
  });

  it('carries the original query string into the next param', () => {
    const decision = decideRouteAccess('/workspace', {
      isAuthenticated: false,
      search: '?tab=work',
    });
    expect(decision.redirectTo).toBe(
      `/login?next=${encodeURIComponent('/workspace?tab=work')}`
    );
  });

  it('next values are always internal paths (encoded), never external URLs', () => {
    const target = loginRedirectFor('/admin/fellowship');
    const next = new URLSearchParams(target.split('?')[1]).get('next');
    expect(next).toBe('/admin/fellowship');
    expect(next?.startsWith('/')).toBe(true);
  });

  it('trailing slashes agree with canonical paths', () => {
    expect(isPublicPath('/towns/')).toBe(true);
    expect(requiresAuth('/workspace/')).toBe(true);
    expect(loginRedirectFor('/workspace/')).toBe('/login?next=%2Fworkspace');
  });
});
