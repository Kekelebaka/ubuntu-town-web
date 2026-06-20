import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Check if we have real Supabase credentials
const hasRealCredentials = supabaseUrl && supabaseUrl !== 'http://localhost:54321/' && supabaseKey && supabaseKey !== 'placeholder-key';

if (!hasRealCredentials) {
  console.log('Ubuntu Town: Using mock data (no Supabase credentials configured)');
} else {
  console.log('Ubuntu Town: Supabase connected to', supabaseUrl.replace(/\/$/, '').split('/').slice(-1)[0]);
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

export { hasRealCredentials };
