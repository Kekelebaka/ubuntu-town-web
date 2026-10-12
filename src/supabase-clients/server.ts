import { Database } from '@/lib/database.types';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createSupabaseClient = async () => {
  const cookieStore = await cookies();

  // NEXT_PUBLIC_* wins (main app). Preview experience workers bake placeholder
  // NEXT_PUBLIC values at build and supply the real URL/key as runtime SERVER vars
  // (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY) — never in client JS.
  const supabaseUrl: string =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey: string =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '';

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
};
