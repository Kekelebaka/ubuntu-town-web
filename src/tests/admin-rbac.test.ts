// src/tests/admin-rbac.test.ts — ADMINISTRATION write-intent law.
// Scope is never assumed. Governance-locked fields are refused. The D-02 bridge is explicit.

import { describe, it, expect } from 'vitest';
import {
  ROLE_FAMILIES, familyByKey, validateGrant, describeGrant,
  validateTownEdit, describeTownEdit, TOWN_EDIT_FIELDS,
  type GrantIntent,
} from '@/lib/admin-rbac';

const base = { email: 'lerato@example.com', personName: 'Lerato Mokoena' };

describe('role families and the D-02 bridge', () => {
  it('maps product families onto the schema enum without renaming anything', () => {
    expect(ROLE_FAMILIES.length).toBeGreaterThanOrEqual(5);
    expect(familyByKey('coordinator')!.roleKey).toBe('coordinator');
    expect(familyByKey('initiative-head')!.roleKey).toBe('ops');
    expect(familyByKey('initiative-head')!.bridgeNote).toContain('D-02');
    expect(familyByKey('hq-admin')!.roleKey).toBe('admin');
  });
  it('scope is never assumed — town roles require a town, initiative roles an initiative', () => {
    expect(validateGrant({ ...base, familyKey: 'coordinator' }).ok).toBe(false);
    expect(validateGrant({ ...base, familyKey: 'coordinator', townId: 't1' }).ok).toBe(true);
    expect(validateGrant({ ...base, familyKey: 'initiative-head' }).ok).toBe(false);
    expect(validateGrant({ ...base, familyKey: 'initiative-head', initiativeKey: 'fixeasy' }).ok).toBe(true);
    expect(validateGrant({ ...base, familyKey: 'staff' }).ok).toBe(true);
    expect(validateGrant({ email: 'nope', personName: 'X', familyKey: 'staff' }).ok).toBe(false);
  });
  it('write previews name every table and defer authority to the database', () => {
    const intent: GrantIntent = {
      action: 'grant-role', userEmail: base.email, userId: 'u1',
      roleFamily: familyByKey('coordinator')!, townId: 't1', townName: 'Senekal',
      initiativeKey: null, personName: base.personName, phone: null,
    };
    expect(intent.roleFamily.roleKey).toBe('coordinator');
    const lines = describeGrant(intent);
    expect(lines.join(' ')).toContain('role_assignments');
    expect(lines.join(' ')).toContain('coordinators');
    expect(lines.join(' ')).toContain('the database decides');
  });
});

describe('town edit law', () => {
  it('refuses governance-locked fields outright', () => {
    const res = validateTownEdit({ is_founding: 'false' });
    expect(res.ok).toBe(false);
    expect(validateTownEdit({ status: 'launch' }).ok).toBe(true);
    expect(validateTownEdit({ applicant_count: '12' }).ok).toBe(true);
    expect(validateTownEdit({ applicant_count: 'twelve' }).ok).toBe(false);
  });
  it('locked fields are marked in the field map and previews carry authority', () => {
    const locked = TOWN_EDIT_FIELDS.filter((f) => f.locked).map((f) => f.name);
    expect(locked).toContain('is_founding');
    expect(locked).toContain('public_self_approve');
    const d = describeTownEdit('Senekal', { status: 'launch' });
    expect(d.join(' ')).toContain('uto.towns.status');
    expect(d.join(' ')).toContain('RLS');
  });
});
