import { describe, it, expect } from 'vitest';

// ============================================================
// Open Redirect Security Tests
// Tests the callback redirect validation logic from:
//   src/app/(auth-pages)/auth/callback/route.ts
//   src/app/(auth-pages)/auth/confirm/route.ts
// ============================================================

// Replicate the callback redirect logic exactly as implemented (FIXED version)
function callbackRedirectLogic(next: string | null, origin: string): string {
  let redirectTo = new URL('/workspace', origin).toString();
  if (next) {
    const decodedNext = decodeURIComponent(next);
    if (decodedNext.startsWith('/') && !decodedNext.startsWith('//')) {
      const resolved = new URL(decodedNext, origin);
      if (resolved.hostname === new URL(origin).hostname) {
        redirectTo = resolved.toString();
      }
    }
  }
  return redirectTo;
}

// Replicate the confirm route redirect logic
function confirmRedirectLogic(nextParam: string | null): string {
  if (!nextParam) return '/workspace';
  const decodedNext = decodeURIComponent(nextParam);
  if (!decodedNext.startsWith('/') || decodedNext.startsWith('//')) {
    return '/workspace';
  }
  const guardOrigin = 'https://ubuntu-town.invalid';
  const resolved = new URL(decodedNext, guardOrigin);
  if (resolved.origin !== guardOrigin) return '/workspace';
  return `${resolved.pathname}${resolved.search}${resolved.hash}`;
}

describe('Open Redirect Security — /auth/callback', () => {
  const ORIGIN = 'https://enter.ubuntutown.co.za';

  describe('Safe internal redirects', () => {
    it('1. accepts /workspace', () => {
      const result = callbackRedirectLogic('/workspace', ORIGIN);
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('2. accepts / (root)', () => {
      const result = callbackRedirectLogic('/', ORIGIN);
      expect(result).toBe('https://enter.ubuntutown.co.za/');
    });

    it('3. accepts /settings', () => {
      const result = callbackRedirectLogic('/settings', ORIGIN);
      expect(result).toBe('https://enter.ubuntutown.co.za/settings');
    });

    it('4. accepts null next — defaults to /workspace', () => {
      const result = callbackRedirectLogic(null, ORIGIN);
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('5. accepts empty string next — defaults to /workspace', () => {
      const result = callbackRedirectLogic('', ORIGIN);
      // Empty string is falsy in the `if (next)` check, so it defaults to /workspace
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });
  });

  describe('Malicious external redirect rejection', () => {
    it('6. rejects //evil.example (protocol-relative) — FIXED', () => {
      const result = callbackRedirectLogic('//evil.example', ORIGIN);
      // After fix: // is rejected by !startsWith('//') check
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('7. rejects https://evil.example (absolute external)', () => {
      const result = callbackRedirectLogic('https://evil.example', ORIGIN);
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('8. rejects javascript:alert(1)', () => {
      const result = callbackRedirectLogic('javascript:alert(1)', ORIGIN);
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('9. rejects encoded protocol-relative %2F%2Fevil.example — FIXED', () => {
      const encoded = encodeURIComponent('//evil.example');
      const result = callbackRedirectLogic(encoded, ORIGIN);
      // After fix: decodeURIComponent('//evil.example') starts with //, rejected
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('10. rejects double-encoded %252F%252Fevil.example', () => {
      const doubleEncoded = encodeURIComponent(encodeURIComponent('//evil.example'));
      const result = callbackRedirectLogic(doubleEncoded, ORIGIN);
      // decodeURIComponent once: %2F%2Fevil.example (starts with %, not /)
      // So the startsWith('/') check fails, defaults to /workspace
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('11. rejects backslash variant \\evil.example', () => {
      const result = callbackRedirectLogic('\\evil.example', ORIGIN);
      // Does NOT start with / (starts with \), so it falls through to default
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });

    it('12. mixed slash/backslash /\\evil.example — now blocked by hostname check', () => {
      const result = callbackRedirectLogic('/\\evil.example', ORIGIN);
      // After fix: the hostname check catches this — resolved hostname is
      // evil.example which != enter.ubuntutown.co.za, so it defaults to /workspace
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace');
    });
  });

  describe('Vulnerability documentation', () => {
    it('13. //evil.example is now blocked by the fix', () => {
      // The fix adds two layers of defence:
      // 1. Reject // (protocol-relative) prefixes explicitly
      // 2. Check that resolved.hostname === origin.hostname

      const vulnNext = '//evil.example';
      const decoded = decodeURIComponent(vulnNext);
      expect(decoded.startsWith('//')).toBe(true); // Now blocked by !startsWith('//')

      const result = callbackRedirectLogic(vulnNext, ORIGIN);
      expect(result).toBe('https://enter.ubuntutown.co.za/workspace'); // Defaults to safe
    });
  });
});

describe('Open Redirect Security — /auth/confirm', () => {
  describe('Safe internal redirects', () => {
    it('14. accepts /workspace', () => {
      expect(confirmRedirectLogic('/workspace')).toBe('/workspace');
    });

    it('15. accepts /update-password', () => {
      expect(confirmRedirectLogic('/update-password')).toBe('/update-password');
    });

    it('16. defaults to /workspace when null', () => {
      expect(confirmRedirectLogic(null)).toBe('/workspace');
    });
  });

  describe('Malicious redirect rejection', () => {
    it('17. rejects //evil.example — defaults to /workspace', () => {
      const result = confirmRedirectLogic('//evil.example');
      expect(result).toBe('/workspace');
    });

    it('18. rejects https://evil.example — does not start with /', () => {
      expect(confirmRedirectLogic('https://evil.example')).toBe('/workspace');
    });

    it('19. rejects javascript:alert(1) — does not start with /', () => {
      expect(confirmRedirectLogic('javascript:alert(1)')).toBe('/workspace');
    });
  });
});
