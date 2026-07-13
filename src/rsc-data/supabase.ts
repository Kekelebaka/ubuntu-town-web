import { createSupabaseClient } from '@/supabase-clients/server';
import { cache } from 'react';

// Only meant to be used in protected pages
// This makes an extra call to the server to verify the user is still logged in
// Use sparingly
export const getCachedLoggedInVerifiedSupabaseUser = cache(async () => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data;
});

// Only meant to be used in protected pages
// This doesn't verify the token with the server, it only validates the stored token
export const getCachedLoggedInSupabaseUser = cache(async () => {
  const supabase = await createSupabaseClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }
  if (!data.session?.user) {
    throw new Error('No user found');
  }
  return data.session.user;
});

// Fixed: replaced getClaims() with getUser() (auth-js 2.x migration)
export const getCachedLoggedInUserId = cache(async () => {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No user found');
  return user.id;
});

export const getCachedIsUserLoggedIn = cache(async () => {
  const supabase = await createSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return !!user;
});
