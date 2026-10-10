import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// ============================================================
// PROFILE DEMO-DATA ABSENCE TEST
// /profile must never again render a hardcoded demo identity. The page shows
// the authenticated user's own data (session + self-readable RLS rows) or an
// explicit empty state.
// ============================================================

const profileSource = readFileSync(
  fileURLToPath(new URL('../app/profile/page.tsx', import.meta.url)),
  'utf8'
);

const FORBIDDEN_DEMO_TOKENS = [
  'Keke Lebaka',
  'keke@example.com',
  '+27 12 345 6789',
  'Mafikeng',
  'Building Ubuntu Town across South Africa',
  'keke',
  'example.com',
];

describe('/profile — no hardcoded demo identity', () => {
  it.each(FORBIDDEN_DEMO_TOKENS)('does not contain %j', (token) => {
    expect(profileSource).not.toContain(token);
  });

  it('has no hardcoded phone number', () => {
    expect(profileSource).not.toMatch(/\+27\s?\d/);
  });

  it('has no literal initial profile values (demo identities were useState literals)', () => {
    // The demo seeded useState with literals; real fields start empty/null.
    expect(profileSource).not.toMatch(/displayName:\s*'/);
    expect(profileSource).not.toMatch(/email:\s*'/);
  });

  it('renders the authenticated user, not a fixture', () => {
    expect(profileSource).toContain('supabase.auth.getUser');
    expect(profileSource).toContain('role_assignments');
    expect(profileSource).toContain('coordinators');
  });

  it('renders explicit empty states instead of fabricated values', () => {
    expect(profileSource).toContain('EmptyState');
    expect(profileSource).toContain('No bio yet');
    expect(profileSource).toContain('No role assignments');
  });
});
