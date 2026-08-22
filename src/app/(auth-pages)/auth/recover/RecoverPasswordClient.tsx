'use client';

import { useAction } from 'next-safe-action/hooks';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { completeRecoveryAction } from '@/data/auth/recovery';

type RecoveryState =
  | 'CALLBACK_RECEIVED'
  | 'VERIFYING'
  | 'RECOVERY_SESSION'
  | 'INVALID_OR_EXPIRED'
  | 'ERROR';

export function RecoverPasswordClient({
  tokenHash,
  next,
}: {
  tokenHash: string | null;
  next: string;
}) {
  const router = useRouter();
  const toastRef = useRef<string | number | undefined>(undefined);
  const [state, setState] = useState<RecoveryState>('CALLBACK_RECEIVED');
  const [message, setMessage] = useState<string | null>(null);

  const { execute, status } = useAction(completeRecoveryAction, {
    onExecute: () => {
      setState('VERIFYING');
      toastRef.current = toast.loading('Verifying your reset link...');
    },
    onSuccess: ({ data }) => {
      setState('RECOVERY_SESSION');
      toast.success('Reset link verified.', { id: toastRef.current });
      toastRef.current = undefined;
      router.replace(data?.next ?? '/update-password');
    },
    onError: ({ error }) => {
      const errorMessage =
        error.serverError ??
        'This password-reset link is invalid or has expired. Please request a new link.';
      setState('INVALID_OR_EXPIRED');
      setMessage(errorMessage);
      toast.error(errorMessage, { id: toastRef.current });
      toastRef.current = undefined;
    },
  });

  useEffect(() => {
    if (!tokenHash) {
      setState('INVALID_OR_EXPIRED');
      setMessage(
        'This password-reset link is missing required recovery information. Please request a new link.'
      );
    }
  }, [tokenHash]);

  const isLoading = status === 'executing' || state === 'VERIFYING';

  return (
    <div className="container min-h-[70vh] grid items-center text-left max-w-lg mx-auto overflow-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle>Continue password reset</CardTitle>
          <CardDescription>
            Ubuntu Town needs one more tap to verify this reset link securely.
            This prevents email security scanners from consuming your reset link
            before you open it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {message ? (
            <p className="text-sm text-destructive" role="alert">
              {message}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={!tokenHash || isLoading}
            onClick={() => {
              if (!tokenHash) return;
              execute({ token_hash: tokenHash, type: 'recovery', next });
            }}
          >
            {isLoading ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Verifying...
              </>
            ) : (
              'Continue to set a new password'
            )}
          </Button>

          <p className="text-sm text-muted-foreground">
            If this link has expired or has already been used, request a new
            password-reset email.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request a new reset link</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
