export const runtime = 'edge';
export const dynamic = 'force-dynamic';

import { ForgotPassword } from './ForgotPassword';

// This route must run as a server function. Without `runtime = 'edge'` the
// next-on-pages build prerenders it, Cloudflare Pages then serves it as a
// static asset, and the server-action POST returns 405 Method Not Allowed —
// so password recovery silently failed with "Failed to send password reset
// link" without ever reaching Supabase. /login, /sign-up and /update-password
// already declare the edge runtime, which is why they were unaffected.

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
