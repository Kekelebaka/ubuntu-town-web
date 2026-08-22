import { describe, expect, it } from 'vitest';

import {
  buildRecoveryRedirectTo,
  sanitizeAuthNextPath,
} from '../utils/auth-recovery';

describe('Password recovery state machine', () => {
  it('routes recovery emails to a non-consuming recovery handoff page', () => {
    const redirectTo = buildRecoveryRedirectTo(
      'https://enter.ubuntutown.co.za',
      '/update-password'
    );

    const url = new URL(redirectTo);
    expect(url.origin).toBe('https://enter.ubuntutown.co.za');
    expect(url.pathname).toBe('/auth/recover');
    expect(url.searchParams.get('next')).toBe('/update-password');
  });

  it('keeps valid recovery next paths internal', () => {
    expect(sanitizeAuthNextPath('/update-password')).toBe('/update-password');
    expect(sanitizeAuthNextPath('/workspace')).toBe('/workspace');
  });

  it('rejects external, protocol-relative, and malformed recovery next paths', () => {
    expect(sanitizeAuthNextPath('https://evil.example')).toBe('/workspace');
    expect(sanitizeAuthNextPath('//evil.example')).toBe('/workspace');
    expect(sanitizeAuthNextPath('/\\evil.example')).toBe('/workspace');
    expect(sanitizeAuthNextPath('javascript:alert(1)')).toBe('/workspace');
  });
});
