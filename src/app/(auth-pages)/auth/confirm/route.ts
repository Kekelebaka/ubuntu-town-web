export const runtime = 'edge';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';

// Verifies an email `token_hash` (magic link, signup confirmation, password
// recovery, email change) via verifyOtp.
//
// WHY THIS EXISTS: the previous flow sent every email link to /auth/callback,
// which runs exchangeCodeForSession(code) — the PKCE flow. PKCE requires the
// code-verifier cookie to live on the SAME browser that requested the link.
// On mobile the link almost always opens in a different browser (the Gmail /
// WhatsApp in-app webview), so the verifier is missing and login fails
// silently. `token_hash` verification does NOT need that cookie, so it works
// cross-device — the common case for our coordinators.
//
// Pair this route with email templates that link to:
//   {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=/workspace
// (see AUTH-RUNBOOK.md).
export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const token_hash = searchParams.get('token_hash');
  const type = (searchParams.get('type') as EmailOtpType | null) ?? 'email';
  const nextParam = searchParams.get('next') ?? '/workspace';
  // Only allow same-origin relative paths as the post-verify destination.
  const next = nextParam.startsWith('/') ? nextParam : '/workspace';

  if (token_hash) {
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

    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  return NextResponse.redirect(new URL('/auth/auth-code-error', origin));
}
