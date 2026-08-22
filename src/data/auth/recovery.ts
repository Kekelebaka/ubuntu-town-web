'use server';

import { actionClient } from '@/lib/safe-action';
import { createSupabaseClient } from '@/supabase-clients/server';
import { sanitizeAuthNextPath } from '@/utils/auth-recovery';
import type { EmailOtpType } from '@supabase/supabase-js';
import { z } from 'zod';

const recoveryTypeSchema = z.enum(['recovery']);

const completeRecoverySchema = z.object({
  token_hash: z.string().min(16),
  type: recoveryTypeSchema.default('recovery'),
  next: z.string().optional(),
});

export const completeRecoveryAction = actionClient
  .schema(completeRecoverySchema)
  .action(async ({ parsedInput: { token_hash, type, next } }) => {
    const supabase = await createSupabaseClient();
    const destination = sanitizeAuthNextPath(next, '/update-password');

    console.info('auth_recovery_event', {
      state: 'VERIFYING',
      type,
      next: destination,
    });

    const { error } = await supabase.auth.verifyOtp({
      type: type as EmailOtpType,
      token_hash,
    });

    if (error) {
      console.warn('auth_recovery_event', {
        state: 'INVALID_OR_EXPIRED',
        type,
        next: destination,
        error: error.message,
      });
      throw new Error(
        'This password-reset link is invalid or has expired. Please request a new link.'
      );
    }

    console.info('auth_recovery_event', {
      state: 'RECOVERY_SESSION',
      type,
      next: destination,
    });

    return { next: destination };
  });
