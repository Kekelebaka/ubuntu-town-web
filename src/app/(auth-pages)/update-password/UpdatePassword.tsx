'use client';

import { useAction } from 'next-safe-action/hooks';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { updatePasswordAction } from '@/data/user/security';

export function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [clientError, setClientError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const { execute, status } = useAction(updatePasswordAction, {
    onExecute: () => {
      setClientError(null);
      toast.loading('Updating password...', { id: 'update-password' });
    },
    onSuccess: () => {
      setSuccess(true);
      toast.success('Password updated.', { id: 'update-password' });
      router.replace('/workspace');
    },
    onError: ({ error }) => {
      const errorMessage = error.serverError ?? 'Failed to update password';
      setClientError(errorMessage);
      toast.error(errorMessage, { id: 'update-password' });
    },
  });

  const isLoading = status === 'executing';

  return (
    <div className="container min-h-[70vh] grid items-center text-left max-w-lg mx-auto overflow-auto px-4">
      <Card>
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a new Ubuntu Town password. It must be at least 8 characters.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (password.length < 8) {
                setClientError('Password must be at least 8 characters.');
                return;
              }
              if (password !== confirmPassword) {
                setClientError('Passwords do not match.');
                return;
              }
              execute({ password });
            }}
          >
            {clientError ? (
              <p className="text-sm text-destructive" role="alert">
                {clientError}
              </p>
            ) : null}
            {success ? (
              <p className="text-sm text-green-600" role="status">
                Password updated. Opening your workspace...
              </p>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="new-password"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isLoading}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                name="confirm-password"
                type={showPasswords ? 'text' : 'password'}
                autoComplete="new-password"
                minLength={8}
                required
                disabled={isLoading}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={isLoading}
              onClick={() => setShowPasswords((value) => !value)}
            >
              {showPasswords ? 'Hide passwords' : 'Show passwords'}
            </Button>

            <Button disabled={isLoading} type="submit" className="w-full">
              {isLoading ? (
                <>
                  <Spinner className="h-4 w-4 mr-2" />
                  Updating...
                </>
              ) : (
                'Update password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
