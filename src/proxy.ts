import { type NextRequest } from 'next/server';
import { updateSession } from './supabase-clients/middleware';

export async function proxy(request: NextRequest) {
  // NOTE: kept in lockstep with src/middleware.ts. On Next 15.5 middleware.ts
  // is the active entry point and this file is inert; if the project upgrades
  // to Next 16 (proxy.ts replaces middleware.ts) the fail-closed route guard
  // must keep running here too. API routes are NOT exempt: the public
  // allowlist in src/lib/route-guard.ts decides (/api/release and
  // /api/revalidate are public; anything else under /api needs a session).
  if (request.nextUrl.pathname) return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

