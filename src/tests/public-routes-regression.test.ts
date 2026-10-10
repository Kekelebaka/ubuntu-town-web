import { describe, it, expect } from 'vitest';
import { decideRouteAccess, isPublicPath } from '../lib/route-guard';

// ============================================================
// PUBLIC ROUTES REGRESSION TEST
// These surfaces are deliberately public (marketing, town directory, auth
// plumbing, application forms, worker handshake). A default-deny refactor must
// never flip them to protected — that would lock the public out of the site.
// ============================================================

const MUST_STAY_PUBLIC = [
  '/',
  '/about',
  '/towns',
  '/town/senekal',
  '/town/clarens',
  '/province/free-state',
  '/province/gauteng',
  '/enter',
  '/apply',
  '/fellowship',
  '/login',
  '/sign-up',
  '/forgot-password',
  '/auth/callback',
  '/auth/confirm',
  '/auth/recover',
  '/auth/auth-code-error',
  '/api/release',
  '/api/revalidate',
  // files served from public/ and excluded by the middleware matcher
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/logos/ubuntu-town.svg',
  '/images/town.jpg',
];

describe('public routes remain public (regression)', () => {
  it.each(MUST_STAY_PUBLIC)('%s allows anonymous visitors', (route) => {
    expect(isPublicPath(route)).toBe(true);
    const decision = decideRouteAccess(route, { isAuthenticated: false });
    expect(decision.allowed).toBe(true);
    expect(decision.redirectTo).toBeNull();
  });

  it('static assets are public but data routes are not', () => {
    expect(isPublicPath('/assets/app.css')).toBe(true);
    expect(isPublicPath('/sw.js')).toBe(true);
    // A dotted path that is NOT a known static asset stays protected.
    expect(isPublicPath('/report.v2')).toBe(false);
    expect(isPublicPath('/api/data.json')).toBe(false);
  });

  it('the two API routes stay public while new API routes do not', () => {
    expect(isPublicPath('/api/release')).toBe(true);
    expect(isPublicPath('/api/revalidate')).toBe(true);
    expect(isPublicPath('/api/anything-else')).toBe(false);
    expect(isPublicPath('/api/release-notes')).toBe(false);
  });
});
