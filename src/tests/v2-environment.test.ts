import { describe, it, expect } from 'vitest';
import { validateV2Environment } from '../../scripts/validate-v2-environment.mjs';
const staging = { LIVING_TOWN_ENABLED: 'true', LIVING_TOWN_MODE: 'staging', LIVING_TOWN_OUTBOUND: 'disabled', LIVING_TOWN_STAGING_SUPABASE_REF: 'abcdefghijklmnopqrst', NEXT_PUBLIC_SUPABASE_URL: 'https://abcdefghijklmnopqrst.supabase.co', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'test-publishable', LIVING_TOWN_STAGING_ORIGIN: 'https://qa-example.pages.dev', NEXT_PUBLIC_SITE_URL: 'https://qa-example.pages.dev' };
describe('Pre-production build hard guard', () => {
  it('allows a fully explicit isolated configuration', () => expect(validateV2Environment(staging)).toEqual([]));
  it('rejects production target substitutions', () => {
    for (const change of [{ NEXT_PUBLIC_SUPABASE_URL: 'https://afiokbhuxfdacbsipoqk.supabase.co' }, { NEXT_PUBLIC_SITE_URL: 'https://enter.ubuntutown.co.za' }, { NEXT_PUBLIC_SITE_URL: 'https://ubuntu-town-web-git.pages.dev' }, { REVALIDATE_URL: 'https://enter.ubuntutown.co.za/api/revalidate' }]) expect(validateV2Environment({ ...staging, ...change }).length).toBeGreaterThan(0);
  });
  it('rejects outbound credentials without exposing values', () => {
    const errors = validateV2Environment({ ...staging, SUPABASE_SERVICE_ROLE_KEY: 'must-never-print', RESEND_API_KEY: 'also-private' });
    expect(errors.length).toBe(2); expect(errors.join()).not.toContain('must-never-print'); expect(errors.join()).not.toContain('also-private');
  });
  it('requires outbound disabled and exact approved ref/origin', () => {
    for (const change of [{ LIVING_TOWN_OUTBOUND: 'enabled' }, { LIVING_TOWN_STAGING_SUPABASE_REF: '' }, { LIVING_TOWN_STAGING_ORIGIN: 'http://qa-example.pages.dev' }, { NEXT_PUBLIC_SITE_URL: 'https://different.pages.dev' }]) expect(validateV2Environment({ ...staging, ...change }).length).toBeGreaterThan(0);
  });
  it('rejects a real database or endpoint in fixture mode', () => {
    expect(validateV2Environment({ ...staging, LIVING_TOWN_MODE: 'fixture' }).length).toBeGreaterThan(0);
    expect(validateV2Environment({ ...staging, WEBHOOK_URL: 'https://other-system.example/hook' }).length).toBeGreaterThan(0);
  });
  it('leaves V1 builds untouched when V2 is disabled', () => expect(validateV2Environment({ NEXT_PUBLIC_SITE_URL: 'https://enter.ubuntutown.co.za' })).toEqual([]));
});
