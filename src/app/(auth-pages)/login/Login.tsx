'use client';
import { useAction } from 'next-safe-action/hooks';
import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Email } from '@/components/Auth/Email';
import { EmailAndPassword } from '@/components/Auth/EmailAndPassword';
import { RenderProviders } from '@/components/Auth/RenderProviders';
import Link from 'next/link';
import { signInWithMagicLinkAction, signInWithProviderAction, signInWithPasswordAction } from '@/data/auth/auth';
import type { AuthProvider } from '@/types';

interface LoginProps { next?: string; }

export function Login({ next }: LoginProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'password' | 'magic' | 'social'>('password');
  const toastRef = useRef<string | number | undefined>(undefined);
  // Coordinators' home is the Workspace (this is what the bootcamp materials
  // point to, and it authorizes via role_assignments). The old default of
  // '/coordinator' sent everyone to a page that looked coordinators up by
  // coordinators.id = auth uid — a link that never exists — so it always showed
  // "Not a Coordinator".
  const redirectTo = next || '/workspace';

  const { execute: executePassword, status: passwordStatus } = useAction(signInWithPasswordAction, {
    onExecute: () => { toastRef.current = toast.loading('Signing in...'); },
    onSuccess: () => { toast.success('Welcome back!', { id: toastRef.current }); router.push(redirectTo); },
    onError: ({ error }) => { toast.error(error.serverError ?? 'Login failed', { id: toastRef.current }); },
  });

  const { execute: executeMagicLink, status: magicLinkStatus } = useAction(signInWithMagicLinkAction, {
    onExecute: () => { toastRef.current = toast.loading('Sending magic link...'); },
    onSuccess: () => { toast.success('Check your email for the magic link!', { id: toastRef.current }); },
    onError: ({ error }) => { toast.error(error.serverError ?? 'Failed to send', { id: toastRef.current }); },
  });

  const { execute: executeProvider, status: providerStatus } = useAction(signInWithProviderAction, {
    onExecute: () => { toastRef.current = toast.loading('Redirecting...'); },
    onSuccess: ({ data }) => { if (data?.url) window.location.href = data.url; },
    onError: ({ error }) => { toast.error(error.serverError ?? 'Login failed', { id: toastRef.current }); },
  });

  return (
    <div className="min-h-screen bg-ubuntu-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-ubuntu-gold/15 flex items-center justify-center mx-auto mb-4 text-2xl">📍</div>
          <h1 className="text-2xl font-bold text-ubuntu-text">Sign in to Ubuntu Town</h1>
          <p className="text-sm text-ubuntu-text-muted mt-1">Access your coordinator dashboard, CV builder, and town services.</p>
        </div>

        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-6">
          <div className="flex rounded-xl bg-ubuntu-cream p-1 mb-6">
            {[
              { id: 'password' as const, label: 'Password' },
              { id: 'magic' as const, label: 'Magic Link' },
              { id: 'social' as const, label: 'Social' },
            ].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${tab === t.id ? 'bg-ubuntu-gold text-white shadow-sm' : 'text-ubuntu-text-muted hover:text-ubuntu-text'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'password' && (
            <EmailAndPassword
              isLoading={passwordStatus === 'executing'}
              onSubmit={(data) => executePassword(data)}
              view="sign-in"
            />
          )}

          {tab === 'magic' && (
            <div>
              <p className="text-xs text-ubuntu-text-muted mb-3">We'll email you a sign-in link. No password needed.</p>
              <Email
                onSubmit={(email) => executeMagicLink({ email, next: redirectTo })}
                isLoading={magicLinkStatus === 'executing'}
                view="sign-in"
              />
            </div>
          )}

          {tab === 'social' && (
            <RenderProviders
              providers={['google', 'github', 'twitter']}
              isLoading={providerStatus === 'executing'}
              onProviderLoginRequested={(provider) => executeProvider({ provider: provider as 'google' | 'github' | 'twitter', next: redirectTo })}
            />
          )}
        </div>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-ubuntu-text-muted">
            Don&apos;t have an account?{' '}
            <Link href={`/sign-up${next ? `?next=${next}` : ''}`} className="text-ubuntu-gold-dark font-semibold hover:underline">Sign up</Link>
          </p>
          <Link href="/" className="text-xs text-ubuntu-text-muted hover:text-ubuntu-gold-dark">← Back to Ubuntu Town</Link>
        </div>
      </div>
    </div>
  );
}
