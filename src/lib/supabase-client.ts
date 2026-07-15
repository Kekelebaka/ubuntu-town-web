import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Check if we have real Supabase credentials
const hasRealCredentials = !!(
  supabaseUrl &&
  supabaseUrl !== 'http://localhost:54321/' &&
  supabaseKey &&
  supabaseKey !== 'placeholder-key'
);

if (!hasRealCredentials) {
  console.log('Ubuntu Town: Using mock data (no Supabase credentials configured)');
} else {
  console.log(
    'Ubuntu Town: Supabase connected to',
    supabaseUrl.replace(/\/$/, '').split('/').slice(-1)[0],
  );
}

// Cookie-based browser client via @supabase/ssr.
// The login flow (server action in src/data/auth/auth.ts) and the middleware
// (src/supabase-clients/middleware.ts) both use @supabase/ssr, which stores the
// auth session in cookies. This browser client MUST also be cookie-based so
// that client components (workspace, coordinator, admin) can see the logged-in
// session. Previously this file used the plain @supabase/supabase-js client,
// which kept its session in localStorage — so after a successful cookie-based
// login, supabase.auth.getUser() returned null here and pages rendered the
// sign-in gate even though the user was authenticated.
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    db: { schema: 'uto' },
  },
);

export { hasRealCredentials };
