import { type NextRequest, NextResponse } from 'next/server';
import { match } from 'path-to-regexp';
import { canUseStaging } from './lib/living-town/contracts';
import { updateSession } from './supabase-clients/middleware';

export const runtime = 'experimental-edge';

const apiRoutes = ['/api{/*path}'];
const RESERVED_SUBDOMAINS = ['enter', 'www', 'api', 'admin', 'mail', 'ftp'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';
  if (pathname === '/living-town' || pathname.startsWith('/living-town/')) {
    if (!canUseStaging({ enabled: process.env.LIVING_TOWN_ENABLED, mode: process.env.LIVING_TOWN_MODE, url: process.env.NEXT_PUBLIC_SUPABASE_URL, key: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY })) return new NextResponse('Not found', { status: 404 });
    const response = process.env.LIVING_TOWN_MODE === 'fixture' ? NextResponse.next() : await updateSession(request);
    response.headers.set('Cache-Control', 'private, no-store, max-age=0');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  if (apiRoutes.some((route) => match(route)(pathname))) {
    return null;
  }

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
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
