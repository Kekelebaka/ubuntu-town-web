export const runtime = 'edge';

import { sanitizeAuthNextPath } from '@/utils/auth-recovery';
import { RecoverPasswordClient } from './RecoverPasswordClient';

export default async function RecoverPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{
    token_hash?: string;
    type?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const next = sanitizeAuthNextPath(params.next, '/update-password');

  console.info('auth_recovery_event', {
    state: 'CALLBACK_RECEIVED',
    hasTokenHash: Boolean(params.token_hash),
    type: params.type ?? 'recovery',
    next,
  });

  return <RecoverPasswordClient tokenHash={params.token_hash ?? null} next={next} />;
}
