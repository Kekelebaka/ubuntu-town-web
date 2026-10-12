/**
 * ROUTE GUARD — single source of truth for "does this path require a session".
 *
 * FAIL CLOSED / DEFAULT DENY: every path is protected unless it is explicitly
 * allowlisted as public below. A new route is protected the moment it is added;
 * making a route public is a deliberate, reviewable edit to this file.
 *
 * This module is deliberately pure (no Next.js, Supabase, or edge imports) so
 * the middleware AND the vitest suite exercise the exact same decision code.
 *
 * Scope note: this decides WHO MAY LOAD a page. It is not an authorization
 * system — row-level security and the app.* helpers in the database still
 * decide what an authenticated person may READ or WRITE (see
 * src/config/capabilities.ts: "a capability decides what a person is SHOWN,
 * never what a person is ALLOWED to do").
 */

/** Paths that are deliberately public — exact matches only. */
export const PUBLIC_EXACT_PATHS: readonly string[] = [
  '/',
  '/login',
  '/sign-up',
  '/forgot-password',
  '/sitemap.xml',
  '/robots.txt',
  '/favicon.ico',
];

/**
 * Path prefixes that are deliberately public. Matched on segment boundaries:
 * '/town' is public and '/town/senekal' is public, but '/town-home' is NOT
 * covered by '/town' and stays protected.
 *
 * - /auth/*     — sign-in plumbing (callback, confirm, recover, errors)
 * - /towns, /town/*, /province/*, /enter, /about — public town directory
 * - /apply, /fellowship — public application forms (writes are insert-only
 *   and attributed by the database; see the route protection matrix)
 * - /api/release — public release provenance (no secrets)
 * - /api/revalidate — worker handshake, token-checked inside the route
 */
export const PUBLIC_PATH_PREFIXES: readonly string[] = [
  // EXPERIENCE 001 (public synthetic demo environment — synthetic data only, no
  // production wiring, consequential actions simulated + human-gated). Explicit allowlist edit.
  '/os',
  // EXPERIENCE 002 (public REAL operating picture — read-only public canonical data;
  // operational layers shown as protected; explicit allowlist edit).
  '/real',
  '/about',
  '/towns',
  '/town',
  '/province',
  '/enter',
  '/apply',
  '/fellowship',
  '/auth',
  '/api/release',
  '/api/revalidate',
];

/**
 * Static asset delivery (public/ and _next output): no user data, no session
 * semantics. Enumerated rather than "any dotted path" so a future route with a
 * dot in it (e.g. /report.v2) cannot silently become public.
 */
const STATIC_ASSET_PATTERN =
  /\.(?:svg|png|jpg|jpeg|gif|webp|ico|avif|css|js|mjs|map|woff2?|ttf|eot|otf|txt|xml|json|webmanifest|pdf|mp4|mp3|webm)$/i;

/** Collapse duplicate/trailing slashes so '/workspace/' and '/workspace' agree. */
function normalizePath(pathname: string): string {
  const collapsed = pathname.replace(/\/+$/, '');
  return collapsed === '' ? '/' : collapsed;
}

/** True when the path is on the public allowlist (exact, prefix, or static asset). */
export function isPublicPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  if (PUBLIC_EXACT_PATHS.includes(path)) return true;
  if (
    PUBLIC_PATH_PREFIXES.some(
      (prefix) => path === prefix || path.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }
  // Static assets are public — but never under /api, where every path is code,
  // not a file, and must not inherit asset semantics (e.g. /api/data.json).
  if (!path.startsWith('/api') && STATIC_ASSET_PATTERN.test(path)) return true;
  return false;
}

/** True when a session is required to load the path (the default). */
export function requiresAuth(pathname: string): boolean {
  return !isPublicPath(pathname);
}

/**
 * Where to send an unauthenticated visitor: /login with a `next` param so they
 * land back on the page they asked for. The value is always an internal path
 * taken from the request pathname — never user-supplied text.
 */
export function loginRedirectFor(pathname: string, search = ''): string {
  const next = `${normalizePath(pathname)}${search}`;
  return `/login?next=${encodeURIComponent(next)}`;
}

export interface RouteAccessDecision {
  allowed: boolean;
  /** Set when allowed === false: full internal redirect target with next param. */
  redirectTo: string | null;
}

/**
 * The one decision the middleware (and the tests) make:
 * public path -> allow; otherwise signed-in -> allow; otherwise -> login.
 */
export function decideRouteAccess(
  pathname: string,
  options: { isAuthenticated: boolean; search?: string }
): RouteAccessDecision {
  if (isPublicPath(pathname) || options.isAuthenticated) {
    return { allowed: true, redirectTo: null };
  }
  return { allowed: false, redirectTo: loginRedirectFor(pathname, options.search ?? '') };
}
