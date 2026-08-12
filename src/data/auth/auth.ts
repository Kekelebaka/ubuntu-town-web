'use server';
import { actionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import { toSiteURL } from '@/utils/helpers';
import { z } from 'zod';

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(3),
});

/**
 * Signs up a new user with email and password.
 * @param {Object} params - The parameters for sign up.
 * @param {string} params.email - The user's email address.
 * @param {string} params.password - The user's password (minimum 8 characters).
 * @returns {Promise<Object>} The data returned from the sign-up process.
 * @throws {Error} If there's an error during sign up.
 */
export const signUpAction = actionClient
  .schema(signUpSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const supabase = await createSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: toSiteURL('/auth/callback'),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  });

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

/**
 * Signs in a user with email and password.
 * @param {Object} params - The parameters for sign in.
 * @param {string} params.email - The user's email address.
 * @param {string} params.password - The user's password.
 * @throws {Error} If there's an error during sign in.
 */
export const signInWithPasswordAction = actionClient
  .schema(signInSchema)
  .action(async ({ parsedInput: { email, password } }) => {
    const supabase = await createSupabaseClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    // No need to return anything if the operation is successful
  });

const signInWithMagicLinkSchema = z.object({
  email: z.string().email(),
  next: z.string().optional(),
});

/**
 * Sends a magic link to the user's email for passwordless sign in.
 * @param {Object} params - The parameters for magic link sign in.
 * @param {string} params.email - The user's email address.
 * @param {string} [params.next] - The URL to redirect to after successful sign in.
 * @throws {Error} If there's an error sending the magic link.
 */
export const signInWithMagicLinkAction = actionClient
  .schema(signInWithMagicLinkSchema)
  .action(async ({ parsedInput: { email, next } }) => {
    const supabase = await createSupabaseClient();
    const redirectUrl = new URL(toSiteURL('/auth/callback'));
    if (next) {
      redirectUrl.searchParams.set('next', next);
    }
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl.toString(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    // No need to return anything if the operation is successful
  });

const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  token: z.string().min(6).max(10),
});

/**
 * Verifies a 6-digit email OTP code and establishes the session.
 *
 * This is the code-entry counterpart to signInWithMagicLinkAction. When the
 * Supabase "Magic Link" email template is switched to emit {{ .Token }}, the
 * same signInWithOtp call delivers a code instead of a link; the user then
 * types it here. This removes the mobile deep-link failure mode entirely
 * (links opening in the wrong browser / being rewritten by mail clients),
 * while still resolving to the same auth.users identity — no second identity
 * model, no change to authorization.
 */
export const verifyEmailOtpAction = actionClient
  .schema(verifyEmailOtpSchema)
  .action(async ({ parsedInput: { email, token } }) => {
    const supabase = await createSupabaseClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      throw new Error(error.message);
    }

    // Session cookies are set by the server client on success.
  });

const signInWithProviderSchema = z.object({
  provider: z.enum(['google', 'github', 'twitter']),
  next: z.string().optional(),
});

/**
 * Initiates OAuth sign in with a specified provider.
 * @param {Object} params - The parameters for OAuth sign in.
 * @param {('google'|'github'|'gitlab'|'bitbucket')} params.provider - The OAuth provider.
 * @param {string} [params.next] - The URL to redirect to after successful sign in.
 * @returns {Promise<{url: string}>} The URL to redirect the user to for OAuth sign in.
 * @throws {Error} If there's an error initiating OAuth sign in.
 */
export const signInWithProviderAction = actionClient
  .schema(signInWithProviderSchema)
  .action(async ({ parsedInput: { provider, next } }) => {
    const supabase = await createSupabaseClient();
    const redirectToURL = new URL(toSiteURL('/auth/callback'));
    if (next) {
      redirectToURL.searchParams.set('next', next);
    }
    const { error, data } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: redirectToURL.toString(),
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return { url: data.url };
  });

const resetPasswordSchema = z.object({
  email: z.string().email(),
});

/**
 * Initiates the password reset process for a user.
 * @param {Object} params - The parameters for password reset.
 * @param {string} params.email - The email address of the user requesting password reset.
 * @throws {Error} If there's an error initiating the password reset.
 */
export const resetPasswordAction = actionClient
  .schema(resetPasswordSchema)
  .action(async ({ parsedInput: { email } }) => {
    const supabase = await createSupabaseClient();
    const redirectToURL = new URL(toSiteURL('/auth/callback'));
    redirectToURL.searchParams.set('next', '/update-password');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectToURL.toString(),
    });

    if (error) {
      throw new Error(error.message);
    }

    // No need to return anything if the operation is successful
  });
