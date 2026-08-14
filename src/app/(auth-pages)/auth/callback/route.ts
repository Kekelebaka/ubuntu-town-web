export const runtime = 'edge';
import { createServerClient } from '@supabase/ssr';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// PKCE code-exchange callback (same-device OAuth / social + same-device email).
// For cross-device EMAIL links (mobile), prefer the token_hash flow handled by
// /auth/confirm — see AUTH-RUNBOOK.md. Two fixes vs. the previous version:
//   1. On a failed exchange, send the user to the error page instead of
//      silently redirecting them (logged-out) to a gated page.
//   2. Default post-login destination is /workspace, not /dashboard — there is
//      no /dashboard route, so the old default 404'd.
export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next');

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Failed to exchange code for session: ', error);
      return NextResponse.redirect(
        new URL('/auth/auth-code-error', requestUrl.origin)
      );
    }
  }

  revalidatePath('/', 'layout');

  let redirectTo = new URL('/workspace', requestUrl.origin);
  if (next) {
    const decodedNext = decodeURIComponent(next);
    if (decodedNext.startsWith('/')) {
      redirectTo = new URL(decodedNext, requestUrl.origin);
    }
  }

  return NextResponse.redirect(redirectTo);
}
