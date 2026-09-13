import { describe, it, expect } from 'vitest';
import { match } from 'path-to-regexp';

// ============================================================
// Workspace Authentication Protection Tests
// Tests the middleware protectedPages logic from:
//   src/supabase-clients/middleware.ts
//
// Verifies that /workspace and all subpaths require authentication.
// ============================================================

// Replicate the protectedPages list from middleware exactly
const protectedPages = [
  '/workspace{/*path}',
  '/dashboard{/*path}',
  '/private-item{/*path}',
  '/private-items{/*path}',
  '/items{/*path}',
  '/item{/*path}',
];

function isProtected(pathname: string): boolean {
  return protectedPages.some((page) => {
    const matcher = match(page);
    return matcher(pathname);
  });
}

describe('Workspace route protection — middleware protectedPages', () => {
  describe('/workspace and subpaths ARE protected', () => {
    it('/workspace is protected', () => {
      expect(isProtected('/workspace')).toBe(true);
    });

    it('/workspace/today is protected', () => {
      expect(isProtected('/workspace/today')).toBe(true);
    });

    it('/workspace/missions is protected', () => {
      expect(isProtected('/workspace/missions')).toBe(true);
    });

    it('/workspace/work is protected', () => {
      expect(isProtected('/workspace/work')).toBe(true);
    });

    it('/workspace/grow is protected', () => {
      expect(isProtected('/workspace/grow')).toBe(true);
    });

    it('/workspace/passport is protected', () => {
      expect(isProtected('/workspace/passport')).toBe(true);
    });

    it('/workspace/review is protected', () => {
      expect(isProtected('/workspace/review')).toBe(true);
    });

    it('/workspace/opportunities is protected', () => {
      expect(isProtected('/workspace/opportunities')).toBe(true);
    });

    it('/workspace/people is protected', () => {
      expect(isProtected('/workspace/people')).toBe(true);
    });

    it('/workspace/town is protected', () => {
      expect(isProtected('/workspace/town')).toBe(true);
    });

    it('/workspace/new is protected', () => {
      expect(isProtected('/workspace/new')).toBe(true);
    });
  });

  describe('Public routes are NOT protected', () => {
    it('/ is not protected', () => {
      expect(isProtected('/')).toBe(false);
    });

    it('/login is not protected', () => {
      expect(isProtected('/login')).toBe(false);
    });

    it('/sign-up is not protected', () => {
      expect(isProtected('/sign-up')).toBe(false);
    });

    it('/about is not protected', () => {
      expect(isProtected('/about')).toBe(false);
    });

    it('/towns is not protected', () => {
      expect(isProtected('/towns')).toBe(false);
    });

    it('/town/senekal is not protected', () => {
      expect(isProtected('/town/senekal')).toBe(false);
    });

    it('/auth/callback is not protected', () => {
      expect(isProtected('/auth/callback')).toBe(false);
    });

    it('/forgot-password is not protected', () => {
      expect(isProtected('/forgot-password')).toBe(false);
    });
  });

  describe('Other protected routes still work', () => {
    it('/dashboard is protected', () => {
      expect(isProtected('/dashboard')).toBe(true);
    });

    it('/private-items/123 is protected', () => {
      expect(isProtected('/private-items/123')).toBe(true);
    });
  });
});
