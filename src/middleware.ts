import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from './supabase-clients/middleware';

export const runtime = 'experimental-edge';

const RESERVED_SUBDOMAINS = ['app', 'enter', 'www', 'api', 'admin', 'mail', 'ftp'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

  // === SUBDOMAIN ROUTING ===
  // senekal.ubuntutown.co.za → rewrite to /town/senekal
  if (hostname.includes('ubuntutown.co.za')) {
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      const subdomain = parts[0].toLowerCase();
      if (!RESERVED_SUBDOMAINS.includes(subdomain)) {
        if (pathname === '/' || pathname === '') {
          const url = request.nextUrl.clone();
          url.pathname = `/town/${subdomain}`;
          return NextResponse.rewrite(url);
        }
      }
    }
  }

  return await updateSession(request);
}

export const config = {
  // FAIL CLOSED: the middleware (and its default-deny route guard) runs for
  // /api too — only /api/release and /api/revalidate are allowlisted public in
  // src/lib/route-guard.ts. Static/sitemap/robots files are excluded here and
  // also allowlisted in the guard, so either layer alone keeps them public.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
