import { type NextRequest, NextResponse } from 'next/server';
import { match } from 'path-to-regexp';
import { updateSession } from './supabase-clients/middleware';

export const runtime = 'experimental-edge';

const apiRoutes = ['/api{/*path}'];
const RESERVED_SUBDOMAINS = ['enter', 'www', 'api', 'admin', 'mail', 'ftp'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hostname = request.headers.get('host') || '';

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
