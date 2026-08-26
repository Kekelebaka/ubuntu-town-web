import { ForgotPassword } from './ForgotPassword';

// This route must be server-rendered. When Next prerenders it, Cloudflare Pages
// serves it as a static asset and the server-action POST returns 405 Method Not
// Allowed, which silently breaks password recovery. /login and /sign-up avoid
// this only because they read the ?next= search param, which opts them out of
// prerendering. This route has no such param, so it must opt out explicitly.
export const dynamic = 'force-dynamic';

export default function ForgotPasswordPage() {
  return <ForgotPassword />;
}
