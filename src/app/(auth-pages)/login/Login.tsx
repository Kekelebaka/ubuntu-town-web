'use client';
import { useAction } from 'next-safe-action/hooks';
import { useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Email } from '@/components/Auth/Email';
import { EmailAndPassword } from '@/components/Auth/EmailAndPassword';
import { RenderProviders } from '@/components/Auth/RenderProviders';
import Link from 'next/link';
import { signInWithMagicLinkAction, signInWithProviderAction, signInWithPasswordAction, verifyEmailOtpAction } from '@/data/auth/auth';
import type { AuthProvider } from '@/types';

interface LoginProps { next?: string; nextActionType?: string; }

export function Login({ next }: LoginProps) {
  const router = useRouter();
  const [tab, setTab] = useState<'password' | 'magic' | 'social'>('password');
  // Email-code (OTP) flow: 'request' collects the email, 'verify' collects the
  // 6-digit code. Keeps password + Google untouched.
  const [otpPhase, setOtpPhase] = useState<'request' | 'verify'>('request');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
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
    onExecute: () => { toastRef.current = toast.loading('Sending your code...'); },
    onSuccess: () => { toast.success('We sent a 6-digit code to your email.', { id: toastRef.current }); setOtpPhase('verify'); },
    onError: ({ error }) => { toast.error(error.serverError ?? 'Failed to send', { id: toastRef.current }); },
  });

  const { execute: executeVerifyOtp, status: verifyOtpStatus } = useAction(verifyEmailOtpAction, {
    onExecute: () => { toastRef.current = toast.loading('Verifying code...'); },
    onSuccess: () => { toast.success('Welcome back!', { id: toastRef.current }); router.push(redirectTo); },
    onError: ({ error }) => { toast.error(error.serverError ?? 'Invalid or expired code', { id: toastRef.current }); },
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/ubuntu-town-mark.png"
            alt="Ubuntu Town"
            width={56}
            height={56}
            className="w-16 h-16 object-contain mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-ubuntu-text">Sign in to Ubuntu Town</h1>
          <p className="text-sm text-ubuntu-text-muted mt-1">Access your coordinator dashboard, CV builder, and town services.</p>
        </div>

        <div className="bg-ubuntu-card border border-ubuntu-border rounded-2xl p-6">
          <div className="flex rounded-xl bg-ubuntu-cream p-1 mb-6">
            {[
              { id: 'password' as const, label: 'Password' },
              { id: 'magic' as const, label: 'Email Code' },
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

          {tab === 'magic' && otpPhase === 'request' && (
            <div>
              <p className="text-xs text-ubuntu-text-muted mb-3">We&apos;ll email you a 6-digit code. No password needed.</p>
              <Email
                onSubmit={(email) => { setOtpEmail(email); executeMagicLink({ email, next: redirectTo }); }}
                isLoading={magicLinkStatus === 'executing'}
                view="sign-in"
              />
            </div>
          )}

          {tab === 'magic' && otpPhase === 'verify' && (
            <form
              onSubmit={(e) => { e.preventDefault(); if (otpCode.trim().length >= 6) executeVerifyOtp({ email: otpEmail, token: otpCode.trim() }); }}
              className="space-y-3"
            >
              <p className="text-xs text-ubuntu-text-muted">
                Enter the 6-digit code sent to <span className="font-semibold text-ubuntu-text">{otpEmail}</span>.
              </p>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={8}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                aria-label="6-digit email code"
                className="w-full rounded-xl border border-ubuntu-border bg-ubuntu-cream px-4 py-3 text-center text-2xl tracking-[0.4em] font-semibold text-ubuntu-text focus:outline-none focus:ring-2 focus:ring-ubuntu-gold"
              />
              <button
                type="submit"
                disabled={verifyOtpStatus === 'executing' || otpCode.trim().length < 6}
                className="w-full rounded-xl bg-ubuntu-gold py-3 text-sm font-semibold text-white shadow-sm disabled:opacity-50"
              >
                {verifyOtpStatus === 'executing' ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <div className="flex items-center justify-between text-xs">
                <button type="button" onClick={() => { setOtpPhase('request'); setOtpCode(''); }} className="text-ubuntu-text-muted hover:text-ubuntu-text">← Change email</button>
                <button type="button" disabled={magicLinkStatus === 'executing'} onClick={() => executeMagicLink({ email: otpEmail, next: redirectTo })} className="text-ubuntu-gold-dark font-semibold hover:underline disabled:opacity-50">Resend code</button>
              </div>
            </form>
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
